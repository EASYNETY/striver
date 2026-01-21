# STRIVER Video Architecture Overhaul - Implementation Plan

## 🎯 Executive Summary
Complete redesign of video infrastructure from local MP4 storage to production-grade CDN-based HLS streaming.

---

## 📋 Current Issues (CRITICAL)

### 1. **App Crashes**
- ❌ Profile screen video tap crashes app
- ❌ Swipe gestures cause crashes
- ❌ Upload takes too long (blocking UI)

### 2. **Architecture Problems**
- ❌ Videos stored as MP4 in Firebase Storage
- ❌ No transcoding or adaptive bitrate
- ❌ Direct MP4 playback (not HLS)
- ❌ No CDN distribution
- ❌ App handles video processing logic
- ❌ Poor feed performance (renders all videos)

---

## 🏗️ New Architecture

```
┌─────────────────┐
│   Mobile App    │
│  (React Native) │
└────────┬────────┘
         │
         │ 1. Request upload URL
         ▼
┌─────────────────┐
│  Backend API    │
│ (Firebase Fns)  │
└────────┬────────┘
         │
         │ 2. Generate CDN upload token
         ▼
┌─────────────────┐
│ Cloudflare      │
│    Stream       │
│   (Video CDN)   │
└────────┬────────┘
         │
         │ 3. Return HLS URL
         ▼
┌─────────────────┐
│   Firestore     │
│   (Metadata)    │
└─────────────────┘
```

---

## 🔧 Implementation Phases

### **PHASE 1: Immediate Crash Fixes** (30 min)
**Priority: CRITICAL**

#### 1.1 Fix Profile Video Tap Crash
- [ ] Add try-catch to video navigation
- [ ] Validate post data before navigation
- [ ] Add error boundary

#### 1.2 Fix Upload UI Blocking
- [ ] Move upload to background task
- [ ] Add progress notification
- [ ] Show toast on completion

#### 1.3 Fix Feed Navigation
- [ ] Ensure FeedScreen is registered
- [ ] Fix navigation params
- [ ] Add loading states

**Deliverable**: App doesn't crash on basic interactions

---

### **PHASE 2: CDN Integration** (2-3 hours)
**Priority: HIGH**

#### 2.1 Cloudflare Stream Setup
```bash
# Get API credentials
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
```

#### 2.2 Backend Functions
Create 3 new Cloud Functions:

**`/api/videos/upload-url`**
```typescript
// Generate direct upload URL from Cloudflare
export const getUploadUrl = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        maxDurationSeconds: 300,
        requireSignedURLs: false
      })
    }
  );
  
  const result = await response.json();
  return {
    uploadURL: result.result.uploadURL,
    uid: result.result.uid
  };
});
```

**`/api/videos/complete`**
```typescript
// Store video metadata after upload
export const completeUpload = functions.https.onCall(async (data, context) => {
  const { videoId, caption, hashtags } = data;
  const uid = context.auth?.uid;
  
  // Get HLS URL from Cloudflare
  const videoInfo = await getCloudflareVideoInfo(videoId);
  
  await admin.firestore().collection('posts').add({
    userId: uid,
    videoId: videoId,
    videoUrl: videoInfo.playback.hls, // HLS URL
    thumbnail: videoInfo.thumbnail,
    caption,
    hashtags,
    status: 'processing', // Will be 'ready' when transcoding completes
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

**`/api/feed`**
```typescript
// Return feed with HLS URLs
export const getFeed = functions.https.onCall(async (data, context) => {
  const posts = await admin.firestore()
    .collection('posts')
    .where('status', '==', 'ready')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();
    
  return posts.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // videoUrl is already HLS URL
  }));
});
```

#### 2.3 Mobile App Upload Flow
```typescript
// src/services/videoUploadService.ts
export const uploadVideo = async (videoUri: string, metadata: any) => {
  // 1. Get upload URL from backend
  const { uploadURL, uid } = await functions().httpsCallable('getUploadUrl')();
  
  // 2. Upload directly to Cloudflare
  const formData = new FormData();
  formData.append('file', {
    uri: videoUri,
    type: 'video/mp4',
    name: 'video.mp4'
  });
  
  await fetch(uploadURL, {
    method: 'POST',
    body: formData
  });
  
  // 3. Notify backend upload is complete
  await functions().httpsCallable('completeUpload')({
    videoId: uid,
    ...metadata
  });
  
  return uid;
};
```

**Deliverable**: Videos upload to CDN, return HLS URLs

---

### **PHASE 3: HLS Playback** (1-2 hours)
**Priority: HIGH**

#### 3.1 Update Video Component
```tsx
// src/components/VideoPlayer.tsx
import Video from 'react-native-video';

export const VideoPlayer = ({ videoUrl, paused }: Props) => {
  return (
    <Video
      source={{ uri: videoUrl }} // HLS URL (.m3u8)
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
      repeat
      paused={paused}
      playInBackground={false}
      playWhenInactive={false}
      // HLS-specific settings
      bufferConfig={{
        minBufferMs: 15000,
        maxBufferMs: 50000,
        bufferForPlaybackMs: 2500,
        bufferForPlaybackAfterRebufferMs: 5000
      }}
    />
  );
};
```

**Deliverable**: App plays HLS streams smoothly

---

### **PHASE 4: Feed Optimization** (2-3 hours)
**Priority: CRITICAL FOR PERFORMANCE**

#### 4.1 Virtualized Feed
```tsx
// src/screens/main/HomeFeedScreen.tsx
const HomeFeedScreen = () => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 2 });
  
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const currentIndex = viewableItems[0].index;
      setVisibleRange({
        start: Math.max(0, currentIndex - 1),
        end: Math.min(posts.length - 1, currentIndex + 1)
      });
    }
  }).current;
  
  const renderItem = ({ item, index }) => {
    const shouldRender = index >= visibleRange.start && index <= visibleRange.end;
    const isPaused = index !== visibleItemIndex;
    
    return (
      <View style={styles.postContainer}>
        {shouldRender ? (
          <VideoPlayer 
            videoUrl={item.videoUrl} 
            paused={isPaused}
          />
        ) : (
          <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFill} />
        )}
      </View>
    );
  };
  
  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
      removeClippedSubviews={true}
      maxToRenderPerBatch={3}
      windowSize={3}
    />
  );
};
```

**Deliverable**: Smooth scrolling, no freezes

---

### **PHASE 5: Background Upload** (1 hour)
**Priority: MEDIUM**

#### 5.1 Upload Queue Service
```typescript
// src/services/uploadQueue.ts
import BackgroundFetch from 'react-native-background-fetch';
import notifee from '@notifee/react-native';

export const queueUpload = async (videoUri: string, metadata: any) => {
  const uploadId = Date.now().toString();
  
  // Store in AsyncStorage queue
  await AsyncStorage.setItem(`upload_${uploadId}`, JSON.stringify({
    videoUri,
    metadata,
    status: 'pending'
  }));
  
  // Show notification
  await notifee.displayNotification({
    title: 'Uploading Video',
    body: 'Your video is being uploaded...',
    android: {
      channelId: 'uploads',
      progress: { max: 100, current: 0 }
    }
  });
  
  // Trigger background task
  BackgroundFetch.scheduleTask({
    taskId: `upload_${uploadId}`,
    delay: 0,
    periodic: false
  });
};
```

**Deliverable**: Non-blocking uploads with notifications

---

## 📊 Performance Metrics

### Before
- ❌ 10+ videos rendered simultaneously
- ❌ 500MB+ memory usage
- ❌ App freezes on scroll
- ❌ iOS watchdog kills

### After
- ✅ Max 3 videos rendered
- ✅ <200MB memory usage
- ✅ 60fps scrolling
- ✅ No crashes

---

## 🔒 Security Checklist

- [ ] No Cloudflare API keys in app
- [ ] Upload URLs expire after 1 hour
- [ ] Backend validates user auth
- [ ] HLS URLs are public (or signed if needed)
- [ ] Rate limiting on upload endpoint

---

## 💰 Cost Estimate (Cloudflare Stream)

- **Storage**: $5/1000 minutes
- **Delivery**: $1/1000 minutes watched
- **Encoding**: Free (included)

**Example**: 1000 users, 10 min/day = ~$15/month

---

## 🚀 Migration Strategy

1. **Week 1**: Implement new upload flow (dual-write to both systems)
2. **Week 2**: Test HLS playback with new videos
3. **Week 3**: Migrate existing videos (run script to upload to CDN)
4. **Week 4**: Remove old Firebase Storage code

---

## 📝 Next Steps

1. **RIGHT NOW**: Fix immediate crashes (Phase 1)
2. **Today**: Set up Cloudflare Stream account
3. **Tomorrow**: Implement backend functions (Phase 2)
4. **This Week**: Complete HLS playback (Phase 3)
5. **Next Week**: Optimize feed (Phase 4)

---

## ❓ Questions to Answer

1. Do you have a Cloudflare account? (Need for Stream)
2. What's your expected video volume? (For cost planning)
3. Should we keep Firebase Storage as backup?
4. Do you want signed URLs (private videos)?

---

**Status**: 🔴 PLAN CREATED - AWAITING APPROVAL TO START IMPLEMENTATION
