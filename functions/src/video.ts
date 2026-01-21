const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');

// Initialize Admin if needed (though usually done in index.ts)
if (admin.apps.length === 0) admin.initializeApp();

// Cloudflare Stream Config
// Set these using: firebase functions:config:set cloudflare.account_id="XXX" cloudflare.api_token="XXX"
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || require('firebase-functions').config().cloudflare?.account_id;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || require('firebase-functions').config().cloudflare?.api_token;

/**
 * Generate Direct Upload URL for Cloudflare Stream
 * 
 * This allows the client to upload video directly to Cloudflare
 * without passing through our backend servers (avoiding timeouts and bandwidth costs).
 */
export const getUploadUrl = onCall(async (request: any) => {
    // 1. Authenticate Request
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in to upload videos.');
    }

    // Check config
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        console.error("Cloudflare credentials missing.");
        throw new HttpsError('internal', 'Video service not configured.');
    }

    const { maxDurationSeconds = 300 } = request.data || {};

    try {
        // 2. Request Direct Upload URL from Cloudflare
        // API Docs: https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    maxDurationSeconds: maxDurationSeconds,
                    requireSignedURLs: false, // Set to true for private videos
                    creator: request.auth.uid,
                    meta: {
                        userId: request.auth.uid,
                        app: 'Striver'
                    }
                })
            }
        );

        const result: any = await response.json();

        if (!result.success) {
            console.error('Cloudflare API Error:', JSON.stringify(result.errors));
            throw new Error('Failed to get upload URL from video provider.');
        }

        // 3. Return URL to Client
        // uploadURL: The URL the client sends the file to
        // uid: The Cloudflare Video ID (we need this to track the video later)
        return {
            uploadURL: result.result.uploadURL,
            videoId: result.result.uid
        };

    } catch (error: any) {
        console.error('getUploadUrl Error:', error);
        throw new HttpsError('internal', 'Unable to initiate upload.', error.message);
    }
});

/**
 * Complete Video Upload
 * 
 * Called by the client after the video is successfully uploaded to Cloudflare.
 * Stores the metadata in Firestore so the feed can display it.
 */
export const completeUpload = onCall(async (request: any) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { videoId, caption, hashtags, squadId } = request.data;
    const db = admin.firestore();

    if (!videoId) {
        throw new HttpsError('invalid-argument', 'Missing videoId.');
    }

    try {
        // 1. Verify Video Exists on Cloudflare (Optional but good for security)
        // For now, we trust the client to be fast, but ideally we check status: ready

        // 2. Construct HLS URL
        // Cloudflare Stream format: https://customer-<CODE>.cloudflarestream.com/<VIDEO_UID>/manifest/video.m3u8
        // Or simpler: https://videodelivery.net/<VIDEO_UID>/manifest/video.m3u8
        const hlsUrl = `https://videodelivery.net/${videoId}/manifest/video.m3u8`;
        const thumbnailUrl = `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg?time=1s&height=600`;

        // 3. Create Post in Firestore
        const postData = {
            userId: request.auth.uid,
            videoId: videoId,
            videoUrl: hlsUrl, // HLS Stream URL
            thumbnailUrl: thumbnailUrl,
            caption: caption || '',
            hashtags: hashtags || [],
            squadId: squadId || null,
            likes: 0,
            comments: 0,
            status: 'processing', // Will be updated eventually via webhook or polling
            provider: 'cloudflare',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const postRef = await db.collection('posts').add(postData);

        // 4. Update user stats (optional)
        await db.collection('users').doc(request.auth.uid).update({
            postsCount: admin.firestore.FieldValue.increment(1)
        });

        return { success: true, postId: postRef.id };

    } catch (error: any) {
        console.error('completeUpload Error:', error);
        throw new HttpsError('internal', 'Failed to save post.');
    }
});
