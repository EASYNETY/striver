# Notifications System Documentation

## Overview
Complete in-app notification system with real-time updates, multiple notification types, and priority levels.

## Features

### Notification Types
1. **like** - When someone likes a post
2. **comment** - When someone comments on a post
3. **reply** - When someone replies to a comment
4. **follow** - When someone follows the user
5. **reward** - When user earns coins/rewards
6. **squad** - Squad-related notifications
7. **upload** - When video upload completes
8. **admin_warning** - Warnings from administrators
9. **squad_approved** - Squad creation approved
10. **squad_rejected** - Squad creation rejected
11. **moderation** - Content moderation actions
12. **verification** - ID verification status

### Priority Levels
- **low** - Regular notifications
- **normal** - Standard notifications (default)
- **high** - Important notifications (highlighted in red)

## Database Structure

### Firestore Path
```
users/{userId}/notifications/{notificationId}
```

### Notification Document
```typescript
{
  type: string,              // Notification type
  title: string,             // Notification title
  message: string,           // Notification message
  fromUser?: {               // Optional: who triggered it
    uid: string,
    username: string,
    avatar: string
  },
  relatedId?: string,        // Optional: related post/squad ID
  priority: string,          // 'low' | 'normal' | 'high'
  read: boolean,             // Read status
  timestamp: Timestamp       // When created
}
```

## Usage

### Import the Helper
```typescript
import notificationsHelper from '../services/notificationsHelper';
```

### Send Notifications

#### Like Notification
```typescript
await notificationsHelper.notifyLike(
  postOwnerId,
  likerUsername,
  likerAvatar,
  likerUid,
  postId
);
```

#### Comment Notification
```typescript
await notificationsHelper.notifyComment(
  postOwnerId,
  commenterUsername,
  commenterAvatar,
  commenterUid,
  postId,
  commentText
);
```

#### Reply Notification
```typescript
await notificationsHelper.notifyReply(
  commentOwnerId,
  replierUsername,
  replierAvatar,
  replierUid,
  postId,
  replyText
);
```

#### Follow Notification
```typescript
await notificationsHelper.notifyFollow(
  followedUserId,
  followerUsername,
  followerAvatar,
  followerUid
);
```

#### Reward Notification
```typescript
await notificationsHelper.notifyReward(
  userId,
  50, // coins amount
  'completing daily challenge'
);
```

#### Upload Complete
```typescript
await notificationsHelper.notifyUploadComplete(
  userId,
  postId
);
```

#### Admin Warning
```typescript
await notificationsHelper.notifyAdminWarning(
  userId,
  'Your content violates community guidelines'
);
```

#### Squad Approved
```typescript
await notificationsHelper.notifySquadApproved(
  userId,
  'Elite Squad',
  squadId
);
```

#### Squad Rejected
```typescript
await notificationsHelper.notifySquadRejected(
  userId,
  'Elite Squad',
  'Name already taken'
);
```

#### Moderation Action
```typescript
await notificationsHelper.notifyModeration(
  userId,
  'removed', // or 'approved', 'flagged'
  'Inappropriate content',
  postId
);
```

#### Verification Status
```typescript
await notificationsHelper.notifyVerification(
  userId,
  true, // approved or false for rejected
  'Identity verified successfully'
);
```

### Custom Notification
```typescript
await notificationsHelper.sendNotification({
  userId: 'user123',
  type: 'reward',
  title: 'Custom Title',
  message: 'Custom message',
  priority: 'high',
  relatedId: 'optional-id'
});
```

### Bulk Notifications
```typescript
await notificationsHelper.sendBulkNotifications(
  ['user1', 'user2', 'user3'],
  {
    type: 'admin_warning',
    title: 'System Maintenance',
    message: 'App will be down for maintenance',
    priority: 'high'
  }
);
```

## Integration Examples

### When User Likes a Post
```typescript
// In your like handler
const handleLike = async (postId: string, postOwnerId: string) => {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) return;

  // Add like to database
  await db.collection('posts').doc(postId).update({
    likes: increment(1)
  });

  // Send notification
  if (postOwnerId !== currentUser.uid) {
    await notificationsHelper.notifyLike(
      postOwnerId,
      currentUser.displayName,
      currentUser.photoURL,
      currentUser.uid,
      postId
    );
  }
};
```

### When Video Upload Completes
```typescript
// In cloudflareVideoService.ts after successful upload
await notificationsHelper.notifyUploadComplete(
  currentUser.uid,
  postRef.id
);
```

### When Admin Moderates Content
```typescript
// In admin panel
const handleModerate = async (videoId: string, status: string, userId: string, feedback: string) => {
  await updateDoc(doc(db, 'posts', videoId), {
    status,
    moderatorFeedback: feedback
  });

  // Notify user
  await notificationsHelper.notifyModeration(
    userId,
    status,
    feedback,
    videoId
  );
};
```

### When Squad is Approved
```typescript
// In admin panel
const approveSquad = async (squadId: string, squadName: string, creatorId: string) => {
  await updateDoc(doc(db, 'squads', squadId), {
    approved: true
  });

  await notificationsHelper.notifySquadApproved(
    creatorId,
    squadName,
    squadId
  );
};
```

## UI Features

### AlertsScreen Features
- Real-time notification updates
- Unread count badge
- "Mark all as read" button
- Pull-to-refresh
- Priority highlighting (high priority in red)
- Contextual navigation (tap to view related content)
- Relative timestamps (e.g., "5m ago", "2h ago")
- Empty state with helpful message

### Visual Indicators
- Unread notifications have green background
- High priority notifications have red border and background
- User avatars for social notifications
- Icons for system notifications
- Unread dot badge on notification icon

## Firebase Cloud Functions Integration

For push notifications, create a Cloud Function:

```typescript
// functions/src/index.ts
export const sendPushNotification = functions.firestore
  .document('users/{userId}/notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const userId = context.params.userId;

    // Get user's FCM token
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) return;

    // Send push notification
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        type: notification.type,
        relatedId: notification.relatedId || ''
      }
    });
  });
```

## Testing

1. **Test in-app notifications**:
   - Like a post
   - Comment on a post
   - Follow a user
   - Check AlertsScreen for notifications

2. **Test admin notifications**:
   - Use admin panel to moderate content
   - Approve/reject squads
   - Send warnings

3. **Test priority levels**:
   - Send high priority notification
   - Verify red highlighting in UI

## Files Modified/Created

### Created:
- `src/services/notificationsHelper.ts` - Notification helper functions
- `NOTIFICATIONS_SYSTEM.md` - This documentation

### Modified:
- `src/screens/main/AlertsScreen.tsx` - Complete rewrite with all notification types

## Next Steps

1. **Integrate with existing features**:
   - Add to like handlers
   - Add to comment handlers
   - Add to follow handlers
   - Add to upload completion

2. **Add push notifications**:
   - Deploy Cloud Function
   - Test FCM integration

3. **Add notification preferences**:
   - Let users control which notifications they receive
   - Add to settings screen

## Support

The notification system is fully functional and ready to use. Simply import the helper and call the appropriate function when events occur.
