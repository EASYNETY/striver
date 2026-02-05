import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from 'firebase-admin';

// Initialize Admin
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();
const getDb = () => db;

setGlobalOptions({ region: 'us-central1' });

import { handleOndatoVerification, syncOndatoStatus } from './ondato';

// Ondato Webhook
export { ondatoWebhook } from './ondato-webhook';

/**
 * USER & AUTH FUNCTIONS
 */
export const sendOTP = onCall(async (request: any) => {
    const sgMail = require("@sendgrid/mail");
    const sendUri = process.env.SENDGRID_API_KEY;
    if (sendUri) sgMail.setApiKey(sendUri);

    const { email, phoneNumber, channel, otp: providedOtp } = request.data;
    const otp = providedOtp || Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    if (request.auth) {
        await getDb().collection('otps').doc(request.auth.uid).set({
            otp, expiresAt, channel,
        });
    }

    try {
        if (channel === 'whatsapp' || channel === 'sms') {
            console.log(`Sending to ${phoneNumber}: ${otp}`);
            return { success: true, message: 'Mock sent' };
        } else {
            if (!sendUri) return { success: false, message: 'SendGrid not configured' };
            const msg = {
                to: email, from: 'noreply@striver.app',
                subject: 'Your Striver Verification Code',
                text: `Your verification code is: ${otp}`,
                html: `<h1 style="color:#8FFBB9;">striver</h1><p>Code: <b>${otp}</b></p>`,
            };
            await sgMail.send(msg);
            return { success: true };
        }
    } catch (error) {
        throw new HttpsError('internal', 'Internal error');
    }
});

export const verifyOTP = onCall(async (request: any) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    const { code } = request.data;
    const otpDoc = await getDb().collection('otps').doc(request.auth.uid).get();
    if (!otpDoc.exists) throw new HttpsError('not-found', 'No code found');
    const { otp, expiresAt } = otpDoc.data() as any;
    if (Date.now() > expiresAt) throw new HttpsError('failed-precondition', 'Code expired');
    if (otp !== code) return { success: false, message: 'Invalid code' };
    await getDb().collection('users').doc(request.auth.uid).update({
        isEmailVerified: true,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await otpDoc.ref.delete();
    return { success: true };
});

/**
 * ONDATO AGE VERIFICATION FUNCTIONS
 */
export const verifyAge = onCall({ cors: true }, async (request) => {
    const { method } = request.data;
    if (method === 'ondato') {
        return await handleOndatoVerification(request.auth, request.data, getDb());
    }
    throw new HttpsError('invalid-argument', `Unsupported verification method: ${method}`);
});

export const startOndatoVerification = onCall({ cors: true }, async (request) => {
    console.log(`[startOndatoVerification] Auth Present: ${!!request.auth}, UID: ${request.auth?.uid || 'NONE'}`);
    if (!request.auth) {
        console.warn('[startOndatoVerification] Missing auth context. Check if client is using regional functions correctly.');
    }
    return await handleOndatoVerification(request.auth, request.data, getDb());
});

export const checkVerificationStatus = onCall({ cors: true }, async (request) => {
    console.log(`[checkVerificationStatus] Auth Present: ${!!request.auth}, UID: ${request.auth?.uid || 'NONE'}`);
    const { sessionId } = request.data;
    if (!sessionId) throw new HttpsError('invalid-argument', 'Session ID is required');

    try {
        const db = getDb();
        // Check for sessionId OR externalReferenceId
        let attemptSnapshot = await db.collection('verification_attempts')
            .where('sessionId', '==', sessionId)
            .limit(1)
            .get();

        if (attemptSnapshot.empty) {
            attemptSnapshot = await db.collection('verification_attempts')
                .where('externalReferenceId', '==', sessionId)
                .limit(1)
                .get();
        }

        if (attemptSnapshot.empty) {
            throw new HttpsError('not-found', 'Verification session not found');
        }

        const attempt = attemptSnapshot.docs[0].data();

        // Use the UID from the attempt if auth is missing
        const effectiveAuth = request.auth || { uid: attempt.userId };

        if (attempt.status === 'pending') {
            try {
                const synced = await syncOndatoStatus(effectiveAuth, request.data, db);
                return {
                    status: synced.status,
                    sessionId: attempt.sessionId || attempt.externalReferenceId,
                    metadata: attempt.metadata,
                    wasSynced: true
                };
            } catch (e) {
                console.warn('Sync failed, returning latest firestore state', e);
            }
        }

        return {
            status: attempt.status,
            sessionId: attempt.sessionId || attempt.externalReferenceId,
            metadata: attempt.metadata,
        };
    } catch (error: any) {
        console.error('Status check error:', error);
        throw new HttpsError('internal', 'Failed to check verification status');
    }
});

/**
 * VIDEO FUNCTIONS
 */
export const getUploadUrl = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');

    const uid = request.auth.uid;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '39b0194586ba888c7b1a77f472a5a652';
    const apiToken = process.env.CLOUDFLARE_API_TOKEN || 'edc91f04199f3506e6194e5d1c9d12c1752db96a65bcd29f046d46fb0100ddb9';

    if (!accountId || !apiToken) throw new HttpsError('internal', 'Server configuration error');

    const axios = require('axios');
    try {
        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
            {
                maxDurationSeconds: 300,
                expiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                requireSignedURLs: false,
                creator: uid,
                meta: { userId: uid, platform: 'striver-app' }
            },
            {
                headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' }
            }
        );

        const { uploadURL, uid: videoId } = response.data.result;
        return { uploadUrl: uploadURL, videoId: videoId };

    } catch (error: any) {
        throw new HttpsError('unavailable', 'Failed to generate upload URL.');
    }
});

export const completeUpload = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

    const { videoId, caption, hashtags, location, challengeId } = request.data;
    const uid = request.auth.uid;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '39b0194586ba888c7b1a77f472a5a652';
    const apiToken = process.env.CLOUDFLARE_API_TOKEN || 'edc91f04199f3506e6194e5d1c9d12c1752db96a65bcd29f046d46fb0100ddb9';

    if (!videoId) throw new HttpsError('invalid-argument', 'Missing videoId');

    const axios = require('axios');
    try {
        const response = await axios.get(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
            { headers: { 'Authorization': `Bearer ${apiToken}` } }
        );

        const videoData = response.data.result;
        const postData = {
            userId: uid,
            videoId: videoId,
            videoUrl: videoData.playback?.hls || '',
            thumbnailUrl: videoData.thumbnail || '',
            previewGif: videoData.preview || '',
            duration: videoData.duration || 0,
            status: videoData.status?.state || 'ready',
            caption: caption || '',
            hashtags: hashtags || [],
            location: location || null,
            challengeId: challengeId || null,
            likes: 0,
            comments: 0,
            views: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const postRef = await getDb().collection('posts').add(postData);
        await getDb().collection('users').doc(uid).update({
            postsCount: admin.firestore.FieldValue.increment(1)
        });

        return { success: true, postId: postRef.id };
    } catch (error: any) {
        throw new HttpsError('internal', 'Failed to finalize video upload.');
    }
});

/**
 * TRIGGER HELPERS
 */
export const getUploadUrlTrigger = onDocumentCreated("vid_upload_requests/{reqId}", async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
    const uid = data.userId;

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '39b0194586ba888c7b1a77f472a5a652';
    const apiToken = process.env.CLOUDFLARE_API_TOKEN || 'edc91f04199f3506e6194e5d1c9d12c1752db96a65bcd29f046d46fb0100ddb9';

    const axios = require('axios');
    try {
        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
            {
                maxDurationSeconds: 300,
                expiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                requireSignedURLs: false,
                creator: uid,
                meta: { userId: uid, platform: 'striver-app' }
            },
            {
                headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' }
            }
        );

        const { uploadURL, uid: videoId } = response.data.result;
        await snap.ref.update({
            response: { uploadUrl: uploadURL, videoId: videoId },
            status: 'success'
        });
    } catch (error: any) {
        await snap.ref.update({ status: 'error', message: error.message });
    }
});

export const completeUploadTrigger = onDocumentCreated("vid_finalization_requests/{reqId}", async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
    const uid = data.userId;
    const { videoId, caption, hashtags, location, challengeId } = data.payload;

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '39b0194586ba888c7b1a77f472a5a652';
    const apiToken = process.env.CLOUDFLARE_API_TOKEN || 'edc91f04199f3506e6194e5d1c9d12c1752db96a65bcd29f046d46fb0100ddb9';

    const axios = require('axios');
    try {
        const response = await axios.get(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
            { headers: { 'Authorization': `Bearer ${apiToken}` } }
        );

        const videoData = response.data.result;
        const postData = {
            userId: uid,
            videoId: videoId,
            videoUrl: videoData.playback?.hls || '',
            thumbnailUrl: videoData.thumbnail || '',
            caption: caption || '',
            hashtags: hashtags || [],
            location: location || null,
            challengeId: challengeId || null,
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            likesCount: 0,
            commentsCount: 0,
            viewsCount: 0
        };

        const postRef = await admin.firestore().collection('posts').add(postData);
        await snap.ref.update({
            status: 'success',
            response: { postId: postRef.id }
        });
    } catch (error: any) {
        await snap.ref.update({ status: 'error', message: error.message });
    }
});

export const getHomeFeed = onCall({ cors: true }, async (request) => {
    try {
        const { lastId, limit = 10 } = request.data;
        let query: any = getDb().collection('posts')
            .where('status', '==', 'ready')
            .orderBy('createdAt', 'desc')
            .limit(limit);

        if (lastId) {
            const lastDoc = await getDb().collection('posts').doc(lastId).get();
            if (lastDoc.exists) query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();
        const posts = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));

        return { posts };
    } catch (error: any) {
        throw new HttpsError('internal', 'Unable to fetch feed.');
    }
});

export const getPlatformStats = onCall({ cors: true }, async (request) => {
    // Check admin logic inside would go here
    try {
        const [usersSnap, postsSnap, pendingSnap] = await Promise.all([
            getDb().collection('users').count().get(),
            getDb().collection('posts').count().get(),
            getDb().collection('posts').where('status', '==', 'pending').count().get(),
        ]);
        return {
            totalUsers: usersSnap.data().count,
            totalVideos: postsSnap.data().count,
            pendingVideos: pendingSnap.data().count,
        };
    } catch (err) {
        return { totalUsers: 0, totalVideos: 0, pendingVideos: 0 };
    }
});

export const moderateVideo = onCall({ cors: true }, async (request) => {
    const { videoId, status, feedback } = request.data;
    await getDb().collection('posts').doc(videoId).update({
        status,
        moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
        moderatorFeedback: feedback || ''
    });
    return { success: true };
});

export const updateUserRole = onCall({ cors: true }, async (request) => {
    const { targetUid, role } = request.data;
    await getDb().collection('users').doc(targetUid).update({
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
});

export const verifyParentPicture = onCall({ cors: true }, async (request) => {
    const { userId, isVerified } = request.data;
    await getDb().collection('users').doc(userId).update({
        parentPictureVerified: isVerified,
        verifiedAt: isVerified ? admin.firestore.FieldValue.serverTimestamp() : null
    });
    return { success: true };
});

export const updatePasswordWithOTP = onCall({ cors: true }, async (request) => {
    const { email, otp, newPassword } = request.data;
    if (!email || !otp || !newPassword) throw new HttpsError('invalid-argument', 'Missing params');
    try {
        const resetDoc = await getDb().collection('passwordResets').doc(email.toLowerCase()).get();
        if (!resetDoc.exists) throw new HttpsError('not-found', 'No reset request');
        const resetData = resetDoc.data() as any;
        if (resetData.otp !== otp) throw new HttpsError('permission-denied', 'Invalid code');
        const userRecord = await admin.auth().getUserByEmail(email.toLowerCase());
        await admin.auth().updateUser(userRecord.uid, { password: newPassword });
        await resetDoc.ref.delete();
        return { success: true };
    } catch (error: any) {
        throw new HttpsError('internal', 'Update failed');
    }
});

export const testV1 = onCall({ region: 'us-central1' }, async () => {
    return { status: "Gen 2 alive" };
});
