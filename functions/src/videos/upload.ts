import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Initialize Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

const getDb = () => admin.firestore();

export const getUploadUrl = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const uid = request.auth.uid;
    const functions = require('firebase-functions');
    const config = functions.config();
    const accountId = config.cloudflare?.account_id;
    const apiToken = config.cloudflare?.api_token;

    if (!accountId || !apiToken) {
        console.error('Missing Cloudflare Configuration');
        throw new HttpsError('internal', 'Server configuration error');
    }

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
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const { uploadURL, uid: videoId } = response.data.result;
        return { uploadUrl: uploadURL, videoId: videoId };

    } catch (error: any) {
        console.error('Cloudflare Error:', error?.response?.data || error.message);
        throw new HttpsError('unavailable', 'Failed to generate upload URL.');
    }
});

export const completeUpload = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

    const { videoId, caption, hashtags, location, challengeId } = request.data;
    const uid = request.auth.uid;
    const functions = require('firebase-functions');
    const config = functions.config();
    const accountId = config.cloudflare?.account_id;
    const apiToken = config.cloudflare?.api_token;

    if (!videoId) throw new HttpsError('invalid-argument', 'Missing videoId');

    try {
        const response = await axios.get(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
            { headers: { 'Authorization': `Bearer ${apiToken}` } }
        );

        const videoData = response.data.result;
        const postData = {
            userId: uid,
            videoId: videoId,
            videoUrl: videoData.playback.hls,
            thumbnail: videoData.thumbnail,
            previewGif: videoData.preview,
            duration: videoData.duration,
            status: videoData.status.state,
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
        console.error('Complete Upload Error:', error?.response?.data || error.message);
        throw new HttpsError('internal', 'Failed to finalize video upload.');
    }
});

export const getHomeFeed = onCall(async (request) => {
    try {
        const { lastId, limit = 10 } = request.data;
        let query: any = getDb().collection('posts')
            .where('status', '==', 'ready')
            .orderBy('createdAt', 'desc')
            .limit(limit);

        if (lastId) {
            const lastDoc = await getDb().collection('posts').doc(lastId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }

        const snapshot = await query.get();
        const posts = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));

        return { posts };

    } catch (error: any) {
        console.error('Get Feed Error:', error);
        throw new HttpsError('internal', 'Unable to fetch feed.');
    }
});
