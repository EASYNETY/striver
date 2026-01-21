
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Generate a direct upload URL for Cloudflare Stream
 * This allows the mobile app to upload directly to Cloudflare without hitting our server
 */
export const getUploadUrl = onCall(async (request) => {
    // 1. Verify Authentication
    if (!request.auth) {
        throw new HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const uid = request.auth.uid;
    // Use legacy config for now as per user environment setup
    const config = require('firebase-functions').config();
    const accountId = config.cloudflare?.account_id;
    const apiToken = config.cloudflare?.api_token;

    // 2. Validate Configuration
    if (!accountId || !apiToken) {
        console.error('Missing Cloudflare Configuration');
        throw new HttpsError(
            'internal',
            'Server configuration error: Missing Cloudflare credentials.'
        );
    }

    try {
        // 3. Request Upload URL from Cloudflare
        // Docs: https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/
        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
            {
                maxDurationSeconds: 300, // 5 minutes limit
                expiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // URL expires in 30 mins
                requireSignedURLs: false, // Videos are public by default for feed
                creator: uid, // Tag with user ID
                meta: {
                    userId: uid,
                    platform: 'striver-app'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const { uploadURL, uid: videoId } = response.data.result;

        // 4. Return the secure URL to the client
        return {
            uploadUrl: uploadURL,
            videoId: videoId
        };

    } catch (error: any) {
        console.error('Cloudflare Upload URL Error:', error?.response?.data || error.message);
        throw new HttpsError(
            'unavailable',
            'Failed to generate upload URL. Please try again.'
        );
    }
});

/**
 * Handle successful video upload completion
 * Called by the app after the file is fully uploaded to Cloudflare
 */
export const completeUpload = onCall(async (request) => {
    // 1. Verify Authentication
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { videoId, caption, hashtags, location, challengeId } = request.data;
    const uid = request.auth.uid;
    const config = require('firebase-functions').config();
    const accountId = config.cloudflare?.account_id;
    const apiToken = config.cloudflare?.api_token;

    if (!videoId) {
        throw new HttpsError('invalid-argument', 'Missing videoId');
    }

    try {
        // 2. Fetch Video Details from Cloudflare (to get thumbnail & HLS url)
        const response = await axios.get(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiToken}`
                }
            }
        );

        const videoData = response.data.result;

        // 3. Store Metadata in Firestore
        const postData = {
            userId: uid,
            videoId: videoId,
            videoUrl: videoData.playback.hls, // The HLS streaming URL
            thumbnail: videoData.thumbnail, // Default thumbnail
            previewGif: videoData.preview, // Short preview GIF
            duration: videoData.duration,
            status: videoData.status.state, // e.g., 'ready', 'processing'
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

        const postRef = await admin.firestore().collection('posts').add(postData);

        // 4. Update User's Video Count
        await admin.firestore().collection('users').doc(uid).update({
            postsCount: admin.firestore.FieldValue.increment(1)
        });

        return { success: true, postId: postRef.id };

    } catch (error: any) {
        console.error('Complete Upload Error:', error?.response?.data || error.message);
        throw new HttpsError('internal', 'Failed to finalize video upload.');
    }
});

/**
 * Fetch HLS-optimized Home Feed
 * Returns videos that are fully processed and ready to stream
 */
export const getHomeFeed = onCall(async (request) => {
    try {
        const { lastId, limit = 10 } = request.data;
        let query = admin.firestore()
            .collection('posts')
            .where('status', '==', 'ready') // Only show processed videos
            .orderBy('createdAt', 'desc')
            .limit(limit);

        if (lastId) {
            const lastDoc = await admin.firestore().collection('posts').doc(lastId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }

        const snapshot = await query.get();
        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { posts };

    } catch (error: any) {
        console.error('Get Feed Error:', error);
        throw new HttpsError('internal', 'Unable to fetch feed.');
    }
});
