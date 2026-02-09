import RNFS from 'react-native-fs';

export interface VideoMetadata {
  caption?: string;
  hashtags?: string[];
  location?: string;
  challengeId?: string;
  responseTo?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload video to Cloudflare Stream CDN
 * Returns the post ID after successful upload
 */
export const uploadVideoToCloudflare = async (
  videoUri: string,
  metadata: VideoMetadata,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    // Verify user is authenticated
    const { firebaseAuth, db } = require('../api/firebase');
    const currentUser = firebaseAuth.currentUser;
    
    if (!currentUser) {
      console.error('[CloudflareVideo] No current user found');
      throw new Error('You must be logged in to upload videos');
    }

    console.log('[CloudflareVideo] User authenticated:', currentUser.uid);
    
    // Cloudflare credentials
    const CLOUDFLARE_ACCOUNT_ID = '8a5b8c863ae28bcd1ac70a41b12c0630';
    const CLOUDFLARE_API_TOKEN = 'DHOYi_QaFYTlp8j9i8tHPqkZFnwLbSsgmF89nefi';

    // Step 1: Get upload URL directly from Cloudflare
    console.log('[CloudflareVideo] Requesting upload URL from Cloudflare...');
    console.log('[CloudflareVideo] Account ID:', CLOUDFLARE_ACCOUNT_ID);
    console.log('[CloudflareVideo] Token (first 10 chars):', CLOUDFLARE_API_TOKEN.substring(0, 10));
    
    const requestBody = {
      maxDurationSeconds: 300,
      expiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      requireSignedURLs: false,
      creator: currentUser.uid,
      meta: { userId: currentUser.uid, platform: 'striver-app' }
    };
    
    console.log('[CloudflareVideo] Request body:', JSON.stringify(requestBody));
    
    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    console.log('[CloudflareVideo] Response status:', uploadResponse.status);
    const uploadData = await uploadResponse.json();
    console.log('[CloudflareVideo] Response data:', JSON.stringify(uploadData));
    
    if (!uploadData.success || !uploadData.result) {
      console.error('[CloudflareVideo] Cloudflare API error:', uploadData);
      throw new Error('Failed to get upload URL from Cloudflare');
    }

    const { uploadURL, uid: videoId } = uploadData.result;
    console.log('[CloudflareVideo] Got upload URL for video:', videoId);

    // Step 2: Upload video directly to Cloudflare
    console.log('[CloudflareVideo] Starting upload to Cloudflare...');
    await uploadToCloudflare(videoUri, uploadURL, onProgress);
    console.log('[CloudflareVideo] Upload to Cloudflare complete');

    // Step 3: Wait for video to be ready and get metadata
    console.log('[CloudflareVideo] Waiting for video processing...');
    
    // Poll for video metadata until thumbnail is ready (max 30 seconds)
    let video: any = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between attempts
      
      const videoResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          }
        }
      );

      const videoData = await videoResponse.json();
      
      if (!videoData.success || !videoData.result) {
        console.error('[CloudflareVideo] Failed to get video metadata:', videoData);
        throw new Error('Failed to get video metadata');
      }

      video = videoData.result;
      console.log('[CloudflareVideo] Video status:', video.status?.state, 'Thumbnail:', video.thumbnail ? 'Available' : 'Not ready');
      
      // Check if thumbnail is ready
      if (video.thumbnail && video.thumbnail.includes('http')) {
        console.log('[CloudflareVideo] Thumbnail ready:', video.thumbnail);
        break;
      }
      
      attempts++;
    }
    
    if (!video) {
      throw new Error('Failed to get video metadata after multiple attempts');
    }

    // Generate thumbnail URL from Cloudflare Stream
    // Format: https://customer-<code>.cloudflarestream.com/<video-id>/thumbnails/thumbnail.jpg
    const thumbnailUrl = video.thumbnail || `https://customer-1vo9wklytlwu1ic.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?time=1s&height=600`;

    // Step 4: Save post to Firestore
    console.log('[CloudflareVideo] Saving post to Firestore...');
    const postData = {
      userId: currentUser.uid,
      videoId: videoId,
      videoUrl: video.playback?.hls || '',
      thumbnailUrl: thumbnailUrl,
      thumbnail: thumbnailUrl,
      previewGif: video.preview || '',
      duration: video.duration || 0,
      status: 'active', // Always set to 'active' for immediate display
      cloudflareStatus: video.status?.state || 'processing', // Store Cloudflare status separately
      caption: metadata.caption || '',
      hashtags: metadata.hashtags || [],
      location: metadata.location || null,
      challengeId: metadata.challengeId || null,
      responseTo: metadata.responseTo || null,
      squadId: metadata.challengeId || null, // For backward compatibility
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const postRef = await db.collection('posts').add(postData);
    
    // Update user's post count
    await db.collection('users').doc(currentUser.uid).update({
      postsCount: require('@react-native-firebase/firestore').FieldValue.increment(1)
    });

    console.log('[CloudflareVideo] Upload complete, postId:', postRef.id);
    return postRef.id;

  } catch (error: any) {
    console.error('[CloudflareVideo] Upload failed with error:', error);
    console.error('[CloudflareVideo] Error stack:', error.stack);
    throw error;
  }
};

/**
 * Upload file to Cloudflare using TUS protocol
 */
const uploadToCloudflare = async (
  videoUri: string,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> => {
  try {
    console.log('[CloudflareVideo] Preparing file for upload...');
    
    // Get file info
    const fileInfo = await RNFS.stat(videoUri);
    console.log('[CloudflareVideo] File size:', fileInfo.size);

    // Create form data
    const formData = new FormData();
    formData.append('file', {
      uri: videoUri,
      type: 'video/mp4',
      name: 'video.mp4'
    } as any);

    console.log('[CloudflareVideo] Uploading to:', uploadUrl);

    // Upload using fetch with FormData
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    console.log('[CloudflareVideo] Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CloudflareVideo] Upload failed:', errorText);
      throw new Error(`Upload failed with status ${response.status}`);
    }

    console.log('[CloudflareVideo] Upload successful');

  } catch (error: any) {
    console.error('[CloudflareVideo] Upload to Cloudflare failed:', error);
    throw error;
  }
};

/**
 * Get video status from Cloudflare
 */
export const getVideoStatus = async (videoId: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/8a5b8c863ae28bcd1ac70a41b12c0630/stream/${videoId}`,
      {
        headers: {
          'Authorization': 'Bearer DHOYi_QaFYTlp8j9i8tHPqkZFnwLbSsgmF89nefi'
        }
      }
    );

    const data = await response.json();
    return data.result?.status?.state || 'unknown';
  } catch (error) {
    console.error('[CloudflareVideo] Failed to get video status:', error);
    return 'unknown';
  }
};

/**
 * Delete video from Cloudflare
 */
export const deleteVideoFromCloudflare = async (videoId: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/8a5b8c863ae28bcd1ac70a41b12c0630/stream/${videoId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer DHOYi_QaFYTlp8j9i8tHPqkZFnwLbSsgmF89nefi'
        }
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[CloudflareVideo] Failed to delete video:', error);
    return false;
  }
};
