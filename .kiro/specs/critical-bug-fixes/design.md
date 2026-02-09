# Design Document

## Overview

This design addresses seven critical bugs through targeted fixes in React Native components, Firestore rules, and service layer logic. Each fix is isolated to minimize risk and enable independent testing.

## Architecture

The fixes span three layers:
- **UI Layer**: React Native components (Bottom tab bar, Points display, Video feed)
- **Service Layer**: Upload, Squad, and Video response services
- **Data Layer**: Firestore security rules and data fetching logic

## Components and Interfaces

### 1. Bottom Tab Bar Fix

**Problem**: Tab bar overlaps content due to missing safe area handling.

**Solution**: Add SafeAreaView or useSafeAreaInsets to ensure proper padding.

**Files to modify**:
- Main navigation component (likely `App.tsx` or navigation setup)
- Screen components with bottom content

**Implementation**:
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// In screen components:
const insets = useSafeAreaInsets();
<View style={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT }}>
  {/* content */}
</View>
```

### 2. Points Display Update

**Problem**: Points update in backend but UI doesn't refresh.

**Solution**: Add real-time listener or force refresh after point-earning actions.

**Files to modify**:
- Points display component (ProfileScreen, RewardsScreen)
- Point-earning action handlers

**Implementation**:
```typescript
// Add Firestore listener
useEffect(() => {
  const unsubscribe = firestore()
    .collection('users')
    .doc(userId)
    .onSnapshot(doc => {
      setPoints(doc.data()?.points || 0);
    });
  return unsubscribe;
}, [userId]);
```

### 3. Video Feed Display

**Problem**: Feed shows empty/black screen despite videos in database.

**Solution**: Fix query logic, error handling, and rendering conditions.

**Files to modify**:
- `HomeFeedScreen.tsx`
- Video fetching service

**Implementation**:
```typescript
// Check query permissions and filters
const videos = await firestore()
  .collection('videos')
  .where('status', '==', 'published')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();

// Add error logging
if (videos.empty) {
  console.log('No videos found - check Firestore rules and data');
}
```

### 4. Video Upload Permissions

**Problem**: Firestore permission errors on upload.

**Solution**: Update Firestore rules to allow authenticated users to create videos.

**Files to modify**:
- `firestore.rules`
- Upload error handling in `UploadScreen.tsx`

**Firestore Rules**:
```javascript
match /videos/{videoId} {
  allow create: if request.auth != null 
    && request.resource.data.userId == request.auth.uid;
  allow read: if request.auth != null;
  allow update, delete: if request.auth != null 
    && resource.data.userId == request.auth.uid;
}
```

### 5. Squad Join Failures

**Problem**: Join operations fail with "Failed to join" error.

**Solution**: Fix Firestore rules for squad membership updates and improve error handling.

**Files to modify**:
- `firestore.rules`
- `SquadDetailScreen.tsx` or squad service
- Squad join handler

**Firestore Rules**:
```javascript
match /squads/{squadId} {
  allow read: if request.auth != null;
  allow update: if request.auth != null 
    && (
      // Allow adding self to members
      request.resource.data.members.hasAll(resource.data.members)
      || resource.data.adminId == request.auth.uid
    );
}

match /users/{userId}/squads/{squadId} {
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

### 6. Daily Perks Functionality

**Problem**: Perk buttons don't respond or process claims.

**Solution**: Fix event handlers, add loading states, and ensure Firestore writes succeed.

**Files to modify**:
- Daily perks component (likely in `RewardsScreen.tsx`)
- Perk claim handler

**Implementation**:
```typescript
const handleClaimPerk = async (perkId: string) => {
  setLoading(true);
  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        [`dailyPerks.${perkId}.claimed`]: true,
        [`dailyPerks.${perkId}.claimedAt`]: firestore.FieldValue.serverTimestamp()
      });
    // Update local state
    setPerks(prev => ({...prev, [perkId]: {...prev[perkId], claimed: true}}));
  } catch (error) {
    console.error('Perk claim failed:', error);
    Alert.alert('Error', 'Failed to claim perk');
  } finally {
    setLoading(false);
  }
};
```

### 7. Video Response Creation

**Problem**: Response interface doesn't show videos or allow recording.

**Solution**: Fix video loading in response modal and ensure response creation flow works.

**Files to modify**:
- Video response component/modal
- Response video creation handler

**Implementation**:
```typescript
// Load original video
const loadVideoForResponse = async (videoId: string) => {
  const videoDoc = await firestore()
    .collection('videos')
    .doc(videoId)
    .get();
  
  if (!videoDoc.exists) {
    throw new Error('Video not found');
  }
  
  setOriginalVideo(videoDoc.data());
};

// Create response
const createResponse = async (responseVideoUrl: string) => {
  await firestore()
    .collection('videos')
    .add({
      userId: currentUserId,
      videoUrl: responseVideoUrl,
      responseToVideoId: originalVideoId,
      createdAt: firestore.FieldValue.serverTimestamp()
    });
  
  // Update original video response count
  await firestore()
    .collection('videos')
    .doc(originalVideoId)
    .update({
      responseCount: firestore.FieldValue.increment(1)
    });
};
```

## Data Models

No new data models required. Existing models:
- User: `{ points, dailyPerks, squads }`
- Video: `{ userId, videoUrl, responseToVideoId, responseCount }`
- Squad: `{ members, adminId }`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Bottom tab bar does not overlap content
*For any* screen with scrollable content, the bottom edge of the content area should be positioned above the top edge of the bottom tab bar, ensuring no overlap.
**Validates: Requirements 1.1, 1.2**

### Property 2: Points display synchronizes with backend
*For any* point-earning action, after the backend records the point change, the displayed points value should match the backend value within 2 seconds.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Multiple point additions accumulate correctly
*For any* sequence of point-earning actions, the final displayed points should equal the sum of all point additions.
**Validates: Requirements 2.4**

### Property 4: Video feed displays database videos
*For any* set of published videos in the database, the video feed should successfully fetch and render those videos with their thumbnails and metadata.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Authenticated users can upload videos
*For any* authenticated user, initiating a video upload should successfully create a video document in Firestore without permission errors.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Squad join updates both user and squad
*For any* authenticated user joining a squad, the operation should successfully add the user to the squad's member list and add the squad to the user's squad list.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: Squad join is idempotent
*For any* user already in a squad, attempting to join the same squad again should not create duplicate entries in either the user's squad list or the squad's member list.
**Validates: Requirements 5.5**

### Property 8: Perk claim updates Firestore and UI
*For any* unclaimed daily perk, when a user claims it, the perk status in Firestore should be updated to claimed and the UI should reflect the claimed state.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 9: Claimed perks show as disabled
*For any* already-claimed daily perk, the UI should display the perk button as disabled or in a claimed state.
**Validates: Requirements 6.4**

### Property 10: Response interface loads videos
*For any* video that can be responded to, tapping "respond to video" should load and display the original video in the response interface.
**Validates: Requirements 7.1**

### Property 11: Response videos link to original
*For any* created response video, the video document in Firestore should contain the correct original video ID in the responseToVideoId field.
**Validates: Requirements 7.3**

### Property 12: Response submission updates both records
*For any* submitted video response, both the response video document should be created and the original video's response count should be incremented by 1.
**Validates: Requirements 7.5**

## Error Handling

Each fix includes specific error handling:

1. **Bottom Tab Bar**: Log layout measurements if overlap detected
2. **Points Display**: Show error toast if points fetch fails, retry mechanism
3. **Video Feed**: Display empty state or error message, provide retry button
4. **Video Upload**: Catch permission errors, display user-friendly message with specific error code
5. **Squad Join**: Catch and display specific join failure reasons (already member, squad full, permission denied)
6. **Daily Perks**: Handle claim failures with error message and retry option
7. **Video Response**: Handle video load failures, display error and allow going back

## Testing Strategy

This spec focuses on bug fixes requiring manual and integration testing rather than extensive property-based testing. Testing approach:

**Manual Testing** (Primary):
- Test each bug fix individually with specific reproduction steps
- Verify fix works in isolation
- Test related functionality to ensure no regressions
- Test on both iOS and Android platforms

**Integration Testing**:
- Test Firestore rules using Firebase emulator
- Verify permission rules allow intended operations
- Test data flow from backend to UI
- Verify real-time listeners update UI correctly

**Unit Testing** (Minimal):
- Test specific helper functions (e.g., layout calculations)
- Test error handling logic
- Test data transformation functions

**Property-Based Testing** (Limited):
- Properties listed above can be validated through integration tests
- Focus on data consistency properties (points accumulation, squad membership)
- Each property should be verified during manual testing of the fix

**Testing Configuration**:
- Use Firebase emulator for Firestore rule testing
- Test with real devices for UI layout issues
- Use React Native debugging tools for component inspection
- Log all errors with detailed context for debugging

**Verification Checklist**:
Each fix must pass:
1. Specific bug reproduction test (bug no longer occurs)
2. Related functionality test (no regressions)
3. Error case handling (appropriate error messages)
4. Cross-platform test (works on iOS and Android)
