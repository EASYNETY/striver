import RNFS from 'react-native-fs';
import { db, firebaseAuth } from '../api/firebase';
import userService from '../api/userService';
import firestore from '@react-native-firebase/firestore';

export interface VideoMetadata {
  caption?: string;
  hashtags?: string[];
  location?: string;
  challengeId?: string;
  responseTo?: string;
  trimStart?: number;
  trimEnd?: number;
  totalDuration?: number;
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
    const currentUser = firebaseAuth.currentUser;

    if (!currentUser) {
      console.error('[CloudflareVideo] No current user found');
      throw new Error('You must be logged in to upload videos');
    }

    console.log('[CloudflareVideo] User authenticated:', currentUser.uid);

    // Cloudflare credentials
    const CLOUDFLARE_ACCOUNT_ID = '8a5b8c863ae28bcd1ac70a41b12c0630';
    const CLOUDFLARE_API_TOKEN = 'DHOYi_QaFYTlp8j9i8tHPqkZFnwLbSsgmF89nefi';

    // Step 1: Get upload URL directly from Cloudflare via XHR for better reliability
    console.log('[CloudflareVideo] Requesting upload URL from Cloudflare (XHR)...');

    const requestBody = {
      maxDurationSeconds: 300,
      expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour expiry
      requireSignedURLs: false,
      creator: currentUser.uid,
      meta: { userId: currentUser.uid, platform: 'striver-app' }
    };

    const uploadData: any = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${CLOUDFLARE_API_TOKEN}`);
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            console.error('[CloudflareVideo] URL Request Failed:', xhr.status, xhr.responseText);
            reject(new Error(`Failed to get upload URL: ${xhr.status}`));
          }
        } catch (e) {
          reject(new Error('Failed to parse Cloudflare response'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error requesting upload URL'));
      xhr.send(JSON.stringify(requestBody));
    });

    if (!uploadData.success || !uploadData.result) {
      console.error('[CloudflareVideo] Cloudflare API error:', uploadData);
      throw new Error('Failed to get upload URL from Cloudflare');
    }

    const { uploadURL, uid: originalVideoId } = uploadData.result;
    let currentVideoId = originalVideoId;
    console.log('[CloudflareVideo] Got upload URL for video:', currentVideoId);

    // Step 2: Upload video directly to Cloudflare
    console.log('[CloudflareVideo] Starting upload to Cloudflare...');
    await uploadToCloudflare(videoUri, uploadURL, onProgress);
    console.log('[CloudflareVideo] Upload to Cloudflare complete');

    // Step 3: MUST WAIT for source video to be 'ready' before clipping
    console.log('[CloudflareVideo] Waiting for source video to be READY for clipping...');
    let sourceVideo: any = null;
    let sourceAttempts = 0;
    const maxSourceAttempts = 15; // Increased to 30-45 seconds total wait

    while (sourceAttempts < maxSourceAttempts) {
      const sourceData: any = await new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${currentVideoId}`);
        xhr.setRequestHeader('Authorization', `Bearer ${CLOUDFLARE_API_TOKEN}`);
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); } catch (e) { resolve({}); }
        };
        xhr.onerror = () => resolve({});
        xhr.send();
      });

      if (sourceData.success && sourceData.result) {
        sourceVideo = sourceData.result;
        console.log(`[CloudflareVideo] Source Status: ${sourceVideo.status?.state}, Duration: ${sourceVideo.duration}s`);

        // clipping requires 'ready' state
        if (sourceVideo.status?.state === 'ready' && sourceVideo.duration > 0) {
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
      sourceAttempts++;
    }

    const trimStart = metadata.trimStart ?? 0;
    const trimEnd = metadata.trimEnd ?? 0;
    // Use the most accurate duration available
    const reportedDuration = (sourceVideo?.duration && sourceVideo.duration > 0)
      ? sourceVideo.duration
      : (metadata.totalDuration || 0);

    // Be extremely inclusive with trimming detection
    // A trim is valid if it starts after 0.1s OR ends more than 0.5s before the end
    const isTrimmed = (trimStart > 0.1) ||
      (reportedDuration > 0 && trimEnd > 0 && trimEnd < reportedDuration - 0.5);

    // If trimming is requested, we use the Clipping API
    if (isTrimmed) {
      console.log(`[CloudflareVideo] Trimming confirmed: ${trimStart.toFixed(2)}s to ${trimEnd.toFixed(2)}s (Total: ${reportedDuration.toFixed(2)}s)`);
      console.log('[CloudflareVideo] WARNING: Cloudflare clipping API has been disabled due to persistent errors.');
      console.log('[CloudflareVideo] Video will be uploaded without trimming. Consider client-side trimming before upload.');
      
      // DISABLED: Clipping API consistently returns 400 errors
      // The API either requires different parameters or is not available for this account
      // Fallback: Use the full uploaded video
    }

    // Step 4: Wait for the FINAL video (original or clip) to have a thumbnail
    console.log('[CloudflareVideo] Waiting for final output to be ready...');
    let video: any = null; // Re-declare video for this step
    let attempts = 0;
    const maxAttempts = 10; // Max attempts for final video/thumbnail

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const videoData: any = await new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${currentVideoId}`);
        xhr.setRequestHeader('Authorization', `Bearer ${CLOUDFLARE_API_TOKEN}`);
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); } catch (e) { resolve({}); }
        };
        xhr.onerror = () => resolve({});
        xhr.send();
      });

      if (videoData.success && videoData.result) {
        video = videoData.result;
        console.log('[CloudflareVideo] Video status:', video.status?.state, 'Thumbnail:', video.thumbnail ? 'Available' : 'Not ready');

        // Check if thumbnail is ready
        if (video.thumbnail && video.thumbnail.includes('http')) {
          console.log('[CloudflareVideo] Thumbnail ready:', video.thumbnail);
          break;
        }
      }

      attempts++;
    }

    if (!video) {
      throw new Error('Failed to get video metadata after multiple attempts');
    }

    // Step 5: Save to Firestore
    // Dynamic URL extraction. Use ivc9... as default, but try to find the actual domain from manifest
    let customerCode = 'ivc9yhc1ytieq1lx';
    if (video.playback?.hls) {
      // url like https://customer-<id>.cloudflarestream.com/.../manifest/video.m3u8
      const match = video.playback.hls.match(/customer-([a-z0-9]+)\./);
      if (match && match[1]) {
        customerCode = match[1];
      }
    }

    const videoUrl = `https://customer-${customerCode}.cloudflarestream.com/${currentVideoId}/watch`;
    const thumbnailUrl = video.thumbnail || `https://customer-${customerCode}.cloudflarestream.com/${currentVideoId}/thumbnails/thumbnail.jpg?time=2s&height=600`;

    console.log(`[CloudflareVideo] Finalizing post. Domain: ${customerCode}, ID: ${currentVideoId}`);

    // Get user profile for denormalization
    let username = currentUser.displayName || `user_${currentUser.uid.substring(0, 8)}`;
    let userAvatar = currentUser.photoURL || '';
    let profile: any = null; // Declare profile here to be accessible

    try {
      profile = await userService.getCurrentUserProfile();
      if (profile) {
        // If in child mode, use the child profile info
        if (profile.activeProfileId) {
          const children = await userService.getChildren(currentUser.uid);
          const activeChild = children.find((c: any) => c.id === profile.activeProfileId);
          if (activeChild) {
            username = activeChild.displayName || activeChild.firstName;
            userAvatar = activeChild.avatar || userAvatar;
          }
        } else {
          username = profile.username || profile.displayName || username;
          userAvatar = profile.avatar || userAvatar;
        }
      }
    } catch (profileError) {
      console.warn('[CloudflareVideo] Could not fetch profile for denormalization:', profileError);
    }

    // Step 4: Save post to Firestore
    console.log('[CloudflareVideo] Saving post to Firestore...');
    const postData = {
      userId: currentUser.uid,
      username: username,
      userAvatar: userAvatar,
      videoId: currentVideoId,
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
      responses: 0,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const postRef = await db.collection('posts').add(postData);

    // Update user's post count
    await db.collection('users').doc(currentUser.uid).update({
      postsCount: firestore.FieldValue.increment(1)
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
  return new Promise((resolve, reject) => {
    try {
      console.log('[CloudflareVideo] Preparing file for upload with XHR...');

      const xhr = new XMLHttpRequest();

      xhr.open('POST', uploadUrl);

      // Handle progress
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage: percentage
            });
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('[CloudflareVideo] Upload successful');
          resolve();
        } else {
          console.error('[CloudflareVideo] Upload failed with status:', xhr.status, xhr.responseText);
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        console.error('[CloudflareVideo] Network error during upload');
        reject(new Error('Network error during upload'));
      };

      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'video.mp4'
      } as any);

      console.log('[CloudflareVideo] XHR sending to:', uploadUrl);
      xhr.send(formData);

    } catch (error: any) {
      console.error('[CloudflareVideo] XHR setup failed:', error);
      reject(error);
    }
  });
};

/**
 * Get video status from Cloudflare
 */
export const getVideoStatus = async (videoId: string): Promise<string> => {
  try {
    const data: any = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `https://api.cloudflare.com/client/v4/accounts/8a5b8c863ae28bcd1ac70a41b12c0630/stream/${videoId}`);
      xhr.setRequestHeader('Authorization', 'Bearer DHOYi_QaFYTlp8j9i8tHPqkZFnwLbSsgmF89nefi');
      xhr.onload = () => {
        try { resolve(JSON.parse(xhr.responseText)); } catch (e) { resolve({}); }
      };
      xhr.onerror = () => reject(new Error('Status network error'));
      xhr.send();
    });
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
    const success: boolean = await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('DELETE', `https://api.cloudflare.com/client/v4/accounts/8a5b8c863ae28bcd1ac70a41b12c0630/stream/${videoId}`);
      xhr.setRequestHeader('Authorization', 'Bearer DHOYi_QaFYTlp8j9i8tHPqkZFnwLbSsgmF89nefi');
      xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
      xhr.onerror = () => resolve(false);
      xhr.send();
    });
    return success;
  } catch (error) {
    console.error('[CloudflareVideo] Failed to delete video:', error);
    return false;
  }
};
