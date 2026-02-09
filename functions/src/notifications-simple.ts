import * as functions from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

/**
 * Send notification when someone likes a post
 */
export const onPostLiked = functions.onDocumentCreated('likes/{likeId}', async (event) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const snap = event.data;
  if (!snap) return;

  const likeData = snap.data();
  const { userId, postId } = likeData;

  try {
    const postDoc = await admin.firestore().collection('posts').doc(postId).get();
    if (!postDoc.exists) return;

    const postData = postDoc.data();
    const postOwnerId = postData?.userId;

    if (userId === postOwnerId) return;

    const likerDoc = await admin.firestore().collection('users').doc(userId).get();
    const likerData = likerDoc.data();

    const ownerDoc = await admin.firestore().collection('users').doc(postOwnerId).get();
    const ownerData = ownerDoc.data();
    const fcmToken = ownerData?.fcmToken;

    if (!fcmToken) {
      console.log('Post owner has no FCM token');
      return;
    }

    const message = {
      notification: {
        title: '👍 New Like!',
        body: `${likerData?.username || 'Someone'} liked your video`,
      },
      data: {
        type: 'like',
        postId: postId,
        userId: userId,
      },
      token: fcmToken,
    };

    await admin.messaging().send(message);
    console.log('Like notification sent successfully');
  } catch (error) {
    console.error('Error sending like notification:', error);
  }
});

/**
 * Send notification when someone comments on a post
 */
export const onPostCommented = functions.onDocumentCreated('comments/{commentId}', async (event) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const snap = event.data;
  if (!snap) return;

  const commentData = snap.data();
  const { userId, postId, text } = commentData;

  try {
    const postDoc = await admin.firestore().collection('posts').doc(postId).get();
    if (!postDoc.exists) return;

    const postData = postDoc.data();
    const postOwnerId = postData?.userId;

    if (userId === postOwnerId) return;

    const commenterDoc = await admin.firestore().collection('users').doc(userId).get();
    const commenterData = commenterDoc.data();

    const ownerDoc = await admin.firestore().collection('users').doc(postOwnerId).get();
    const ownerData = ownerDoc.data();
    const fcmToken = ownerData?.fcmToken;

    if (!fcmToken) {
      console.log('Post owner has no FCM token');
      return;
    }

    const message = {
      notification: {
        title: '💬 New Comment!',
        body: `${commenterData?.username || 'Someone'}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
      },
      data: {
        type: 'comment',
        postId: postId,
        userId: userId,
      },
      token: fcmToken,
    };

    await admin.messaging().send(message);
    console.log('Comment notification sent successfully');
  } catch (error) {
    console.error('Error sending comment notification:', error);
  }
});

/**
 * Send notification when someone follows you
 */
export const onNewFollower = functions.onDocumentCreated('follows/{followId}', async (event) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const snap = event.data;
  if (!snap) return;

  const followData = snap.data();
  const { followerId, followingId } = followData;

  try {
    const followerDoc = await admin.firestore().collection('users').doc(followerId).get();
    const followerData = followerDoc.data();

    const followedDoc = await admin.firestore().collection('users').doc(followingId).get();
    const followedData = followedDoc.data();
    const fcmToken = followedData?.fcmToken;

    if (!fcmToken) {
      console.log('Followed user has no FCM token');
      return;
    }

    const message = {
      notification: {
        title: '👤 New Follower!',
        body: `${followerData?.username || 'Someone'} started following you`,
      },
      data: {
        type: 'follow',
        userId: followerId,
      },
      token: fcmToken,
    };

    await admin.messaging().send(message);
    console.log('Follower notification sent successfully');
  } catch (error) {
    console.error('Error sending follower notification:', error);
  }
});

/**
 * Send notification when someone responds to your video
 */
export const onVideoResponse = functions.onDocumentCreated('posts/{postId}', async (event) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const snap = event.data;
  if (!snap) return;

  const postData = snap.data();
  const { userId, responseTo } = postData;

  if (!responseTo) return;

  try {
    const originalPostDoc = await admin.firestore().collection('posts').doc(responseTo).get();
    if (!originalPostDoc.exists) return;

    const originalPostData = originalPostDoc.data();
    const originalPostOwnerId = originalPostData?.userId;

    if (userId === originalPostOwnerId) return;

    const responderDoc = await admin.firestore().collection('users').doc(userId).get();
    const responderData = responderDoc.data();

    const ownerDoc = await admin.firestore().collection('users').doc(originalPostOwnerId).get();
    const ownerData = ownerDoc.data();
    const fcmToken = ownerData?.fcmToken;

    if (!fcmToken) {
      console.log('Original post owner has no FCM token');
      return;
    }

    const message = {
      notification: {
        title: '🎥 New Response!',
        body: `${responderData?.username || 'Someone'} responded to your video`,
      },
      data: {
        type: 'response',
        postId: snap.id,
        originalPostId: responseTo,
        userId: userId,
      },
      token: fcmToken,
    };

    await admin.messaging().send(message);
    console.log('Response notification sent successfully');
  } catch (error) {
    console.error('Error sending response notification:', error);
  }
});

/**
 * Send notification for challenge invites
 */
export const onChallengeInvite = functions.onDocumentCreated('challengeInvites/{inviteId}', async (event) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const snap = event.data;
  if (!snap) return;

  const inviteData = snap.data();
  const { fromUserId, toUserId, challengeId } = inviteData;

  try {
    const inviterDoc = await admin.firestore().collection('users').doc(fromUserId).get();
    const inviterData = inviterDoc.data();

    const invitedDoc = await admin.firestore().collection('users').doc(toUserId).get();
    const invitedData = invitedDoc.data();
    const fcmToken = invitedData?.fcmToken;

    if (!fcmToken) {
      console.log('Invited user has no FCM token');
      return;
    }

    const message = {
      notification: {
        title: '🏆 Challenge Invite!',
        body: `${inviterData?.username || 'Someone'} invited you to a challenge`,
      },
      data: {
        type: 'challenge',
        challengeId: challengeId,
        fromUserId: fromUserId,
      },
      token: fcmToken,
    };

    await admin.messaging().send(message);
    console.log('Challenge invite notification sent successfully');
  } catch (error) {
    console.error('Error sending challenge invite notification:', error);
  }
});
