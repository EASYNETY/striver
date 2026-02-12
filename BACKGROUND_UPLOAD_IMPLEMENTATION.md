# Background Upload Implementation - TikTok Style

## Overview
Implement background video upload with notifications, allowing users to continue using the app while videos upload.

## Required Dependencies

```bash
npm install react-native-ffmpeg-min --save
npm install @notifee/react-native --save  # Already installed
npm install react-native-background-upload --save
```

## Implementation Steps

### 1. Video Trimming Service
Create `src/services/videoProcessingService.ts` to handle video trimming using FFmpeg.

### 2. Background Upload Service  
Create `src/services/backgroundUploadService.ts` (already exists, needs enhancement) to:
- Queue uploads
- Show progress notifications
- Handle upload completion
- Navigate to uploaded video

### 3. Upload Queue Manager
- Store pending uploads in AsyncStorage
- Retry failed uploads
- Show upload status in notification

### 4. User Experience Flow

**When user taps "Post":**
1. Show toast: "Uploading video in background..."
2. Navigate back to Home Feed immediately
3. Show persistent notification with upload progress
4. When complete: Show notification "Video uploaded! Tap to view"
5. Tapping notification navigates to the uploaded video

## Files to Create/Modify

1. **src/services/videoProcessingService.ts** - NEW
   - `trimVideo(uri, start, end)` - Trim video using FFmpeg
   - Returns trimmed video URI

2. **src/services/backgroundUploadService.ts** - ENHANCE
   - `queueUpload(videoUri, metadata, trimStart, trimEnd)` - Add to queue
   - `processQueue()` - Process uploads one by one
   - `showUploadNotification(progress)` - Show progress
   - `showCompletionNotification(postId)` - Show completion

3. **src/screens/main/UploadScreen.tsx** - MODIFY
   - Change `handlePost()` to queue upload instead of blocking
   - Navigate immediately after queuing
   - Remove loading state (happens in background)

4. **App.tsx** - MODIFY
   - Initialize background upload service
   - Handle notification taps to navigate to video

## Detailed Implementation

### Video Processing Service

```typescript
import { FFmpegKit, ReturnCode } from 'react-native-ffmpeg-min';
import RNFS from 'react-native-fs';

export const trimVideo = async (
  inputUri: string,
  startTime: number,
  endTime: number
): Promise<string> => {
  const outputPath = `${RNFS.CachesDirectoryPath}/trimmed_${Date.now()}.mp4`;
  
  // FFmpeg command to trim video
  const command = `-i "${inputUri}" -ss ${startTime} -to ${endTime} -c copy "${outputPath}"`;
  
  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();
  
  if (ReturnCode.isSuccess(returnCode)) {
    return `file://${outputPath}`;
  } else {
    throw new Error('Video trimming failed');
  }
};
```

### Background Upload Service Enhancement

```typescript
import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UploadTask {
  id: string;
  videoUri: string;
  metadata: VideoMetadata;
  trimStart?: number;
  trimEnd?: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  postId?: string;
}

class BackgroundUploadService {
  private queue: UploadTask[] = [];
  private isProcessing = false;
  
  async queueUpload(
    videoUri: string,
    metadata: VideoMetadata,
    trimStart?: number,
    trimEnd?: number
  ): Promise<string> {
    const taskId = `upload_${Date.now()}`;
    
    const task: UploadTask = {
      id: taskId,
      videoUri,
      metadata,
      trimStart,
      trimEnd,
      status: 'pending',
      progress: 0
    };
    
    this.queue.push(task);
    await this.saveQueue();
    
    // Show initial notification
    await this.showUploadNotification(task);
    
    // Start processing if not already
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return taskId;
  }
  
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const task = this.queue[0];
      
      try {
        task.status = 'uploading';
        await this.saveQueue();
        
        // Trim video if needed
        let videoToUpload = task.videoUri;
        if (task.trimStart !== undefined && task.trimEnd !== undefined) {
          videoToUpload = await trimVideo(
            task.videoUri,
            task.trimStart,
            task.trimEnd
          );
        }
        
        // Upload with progress
        const postId = await uploadVideoToCloudflare(
          videoToUpload,
          task.metadata,
          (progress) => {
            task.progress = progress.percentage;
            this.showUploadNotification(task);
          }
        );
        
        task.status = 'completed';
        task.postId = postId;
        await this.showCompletionNotification(task);
        
        // Remove from queue
        this.queue.shift();
        await this.saveQueue();
        
      } catch (error) {
        task.status = 'failed';
        await this.showErrorNotification(task);
        this.queue.shift();
        await this.saveQueue();
      }
    }
    
    this.isProcessing = false;
  }
  
  private async showUploadNotification(task: UploadTask) {
    const channelId = await notifee.createChannel({
      id: 'upload',
      name: 'Video Uploads',
      importance: AndroidImportance.LOW,
    });
    
    await notifee.displayNotification({
      id: task.id,
      title: 'Uploading video...',
      body: `${Math.round(task.progress)}% complete`,
      android: {
        channelId,
        progress: {
          max: 100,
          current: Math.round(task.progress),
        },
        ongoing: true,
        onlyAlertOnce: true,
      },
    });
  }
  
  private async showCompletionNotification(task: UploadTask) {
    const channelId = await notifee.createChannel({
      id: 'upload_complete',
      name: 'Upload Complete',
      importance: AndroidImportance.HIGH,
    });
    
    await notifee.displayNotification({
      id: `${task.id}_complete`,
      title: '🎉 Video uploaded!',
      body: 'Tap to view your video',
      android: {
        channelId,
        pressAction: {
          id: 'view_video',
          launchActivity: 'default',
        },
      },
      data: {
        postId: task.postId,
        action: 'view_video',
      },
    });
    
    // Cancel the progress notification
    await notifee.cancelNotification(task.id);
  }
  
  private async showErrorNotification(task: UploadTask) {
    await notifee.displayNotification({
      title: 'Upload failed',
      body: 'Tap to retry',
      android: {
        channelId: 'upload_complete',
        pressAction: {
          id: 'retry_upload',
        },
      },
      data: {
        taskId: task.id,
        action: 'retry_upload',
      },
    });
    
    await notifee.cancelNotification(task.id);
  }
  
  private async saveQueue() {
    await AsyncStorage.setItem('upload_queue', JSON.stringify(this.queue));
  }
  
  async loadQueue() {
    const saved = await AsyncStorage.getItem('upload_queue');
    if (saved) {
      this.queue = JSON.parse(saved);
      // Resume processing if there are pending uploads
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }
}

export const backgroundUploadService = new BackgroundUploadService();
```

### Modified UploadScreen

```typescript
const handlePost = async () => {
  if (!title.trim()) {
    Alert.alert("Missing Info", "Please add a caption for your video.");
    return;
  }

  if (!videoUri) {
    Alert.alert("No Video Selected", "Please select or record a video first.");
    return;
  }

  try {
    // Queue the upload (non-blocking)
    await backgroundUploadService.queueUpload(
      videoUri,
      {
        caption: title,
        hashtags: tags.split(',').map(tag => tag.trim()).filter(t => t.length > 0),
        challengeId: squadId || challengeId,
        responseTo: responseTo || challengePostId,
      },
      trimStartTime,
      trimEndTime
    );

    // Show toast
    Alert.alert(
      "Upload Started",
      "Your video is uploading in the background. We'll notify you when it's ready!",
      [{ text: "OK", onPress: () => navigation.navigate('HomeFeed') }]
    );

  } catch (error: any) {
    Alert.alert("Error", "Failed to start upload. Please try again.");
  }
};
```

### App.tsx Notification Handler

```typescript
import notifee, { EventType } from '@notifee/react-native';
import { backgroundUploadService } from './src/services/backgroundUploadService';

// In App component
useEffect(() => {
  // Load pending uploads on app start
  backgroundUploadService.loadQueue();
  
  // Handle notification taps
  const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      const { postId, action } = detail.notification?.data || {};
      
      if (action === 'view_video' && postId) {
        // Navigate to the uploaded video
        navigationRef.current?.navigate('HomeFeed', { 
          scrollToPost: postId 
        });
      }
    }
  });
  
  return unsubscribe;
}, []);
```

## Benefits

1. **Better UX**: Users can continue using app while uploading
2. **Progress Tracking**: Real-time upload progress in notification
3. **Reliability**: Queue persists across app restarts
4. **Feedback**: Clear notifications for success/failure
5. **Navigation**: Easy access to uploaded video

## Testing Checklist

- [ ] Video trims correctly to selected duration
- [ ] Upload starts immediately after tapping Post
- [ ] User can navigate away during upload
- [ ] Progress notification updates correctly
- [ ] Completion notification appears
- [ ] Tapping notification navigates to video
- [ ] Failed uploads show retry option
- [ ] Queue persists across app restarts
- [ ] Multiple uploads queue properly

## Alternative: Simpler Approach (No FFmpeg)

If FFmpeg is too complex, we can:
1. Pass trim parameters to Cloudflare API
2. Let Cloudflare handle trimming server-side
3. Still implement background upload with notifications

This requires checking if Cloudflare Stream API supports trim parameters.
