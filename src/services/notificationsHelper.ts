import { db } from '../api/firebase';
import firestore from '@react-native-firebase/firestore';

export interface NotificationData {
    type: 'like' | 'comment' | 'reply' | 'follow' | 'reward' | 'squad' | 'upload' | 'admin_warning' | 'squad_approved' | 'squad_rejected' | 'moderation' | 'verification';
    title: string;
    message: string;
    userId: string; // Recipient user ID
    fromUser?: {
        uid: string;
        username: string;
        avatar: string;
    };
    relatedId?: string; // Post ID, Squad ID, etc.
    priority?: 'low' | 'normal' | 'high';
}

/**
 * Send a notification to a user
 */
export const sendNotification = async (data: NotificationData): Promise<void> => {
    try {
        await db.collection('users').doc(data.userId).collection('notifications').add({
            type: data.type,
            title: data.title,
            message: data.message,
            fromUser: data.fromUser || null,
            relatedId: data.relatedId || null,
            priority: data.priority || 'normal',
            read: false,
            timestamp: firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`[Notifications] Sent ${data.type} notification to ${data.userId}`);
    } catch (error) {
        console.error('[Notifications] Failed to send notification:', error);
    }
};

/**
 * Send notification to multiple users
 */
export const sendBulkNotifications = async (userIds: string[], data: Omit<NotificationData, 'userId'>): Promise<void> => {
    try {
        const promises = userIds.map(userId => 
            sendNotification({ ...data, userId })
        );
        await Promise.all(promises);
        console.log(`[Notifications] Sent bulk notifications to ${userIds.length} users`);
    } catch (error) {
        console.error('[Notifications] Failed to send bulk notifications:', error);
    }
};

/**
 * Helper functions for common notification types
 */

export const notifyLike = async (postOwnerId: string, likerUsername: string, likerAvatar: string, likerUid: string, postId: string) => {
    await sendNotification({
        userId: postOwnerId,
        type: 'like',
        title: 'New Like',
        message: `${likerUsername} liked your video`,
        fromUser: {
            uid: likerUid,
            username: likerUsername,
            avatar: likerAvatar
        },
        relatedId: postId
    });
};

export const notifyComment = async (postOwnerId: string, commenterUsername: string, commenterAvatar: string, commenterUid: string, postId: string, commentText: string) => {
    await sendNotification({
        userId: postOwnerId,
        type: 'comment',
        title: 'New Comment',
        message: `${commenterUsername}: ${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}`,
        fromUser: {
            uid: commenterUid,
            username: commenterUsername,
            avatar: commenterAvatar
        },
        relatedId: postId
    });
};

export const notifyReply = async (commentOwnerId: string, replierUsername: string, replierAvatar: string, replierUid: string, postId: string, replyText: string) => {
    await sendNotification({
        userId: commentOwnerId,
        type: 'reply',
        title: 'New Reply',
        message: `${replierUsername} replied: ${replyText.substring(0, 50)}${replyText.length > 50 ? '...' : ''}`,
        fromUser: {
            uid: replierUid,
            username: replierUsername,
            avatar: replierAvatar
        },
        relatedId: postId
    });
};

export const notifyFollow = async (followedUserId: string, followerUsername: string, followerAvatar: string, followerUid: string) => {
    await sendNotification({
        userId: followedUserId,
        type: 'follow',
        title: 'New Follower',
        message: `${followerUsername} started following you`,
        fromUser: {
            uid: followerUid,
            username: followerUsername,
            avatar: followerAvatar
        }
    });
};

export const notifyReward = async (userId: string, coins: number, reason: string) => {
    await sendNotification({
        userId,
        type: 'reward',
        title: 'Coins Earned!',
        message: `You earned ${coins} coins for ${reason}`
    });
};

export const notifyUploadComplete = async (userId: string, postId: string) => {
    await sendNotification({
        userId,
        type: 'upload',
        title: 'Upload Complete',
        message: 'Your video is now live!',
        relatedId: postId
    });
};

export const notifyAdminWarning = async (userId: string, reason: string) => {
    await sendNotification({
        userId,
        type: 'admin_warning',
        title: 'Warning from Admin',
        message: reason,
        priority: 'high'
    });
};

export const notifySquadApproved = async (userId: string, squadName: string, squadId: string) => {
    await sendNotification({
        userId,
        type: 'squad_approved',
        title: 'Squad Approved!',
        message: `Your squad "${squadName}" has been approved`,
        relatedId: squadId
    });
};

export const notifySquadRejected = async (userId: string, squadName: string, reason: string) => {
    await sendNotification({
        userId,
        type: 'squad_rejected',
        title: 'Squad Not Approved',
        message: `Your squad "${squadName}" was not approved. Reason: ${reason}`,
        priority: 'high'
    });
};

export const notifyModeration = async (userId: string, action: string, reason: string, postId?: string) => {
    await sendNotification({
        userId,
        type: 'moderation',
        title: `Content ${action}`,
        message: `Reason: ${reason}`,
        relatedId: postId,
        priority: 'high'
    });
};

export const notifyVerification = async (userId: string, approved: boolean, feedback: string) => {
    await sendNotification({
        userId,
        type: 'verification',
        title: approved ? 'Verification Approved' : 'Verification Rejected',
        message: feedback,
        priority: approved ? 'normal' : 'high'
    });
};

export default {
    sendNotification,
    sendBulkNotifications,
    notifyLike,
    notifyComment,
    notifyReply,
    notifyFollow,
    notifyReward,
    notifyUploadComplete,
    notifyAdminWarning,
    notifySquadApproved,
    notifySquadRejected,
    notifyModeration,
    notifyVerification
};
