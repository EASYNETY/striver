import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { db, firebaseAuth } from '../api/firebase';

export class NotificationService {
  /**
   * Request notification permissions
   */
  static async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('[Notifications] iOS permission granted:', authStatus);
        }

        return enabled;
      } else {
        // Android 13+ requires POST_NOTIFICATIONS permission
        if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // Android < 13 doesn't need permission
      }
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Get FCM token and save to Firestore
   */
  static async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('[Notifications] FCM Token:', token);

      // Save token to user document
      const currentUser = firebaseAuth.currentUser;
      if (currentUser && token) {
        await db.collection('users').doc(currentUser.uid).update({
          fcmToken: token,
          fcmTokenUpdatedAt: new Date(),
        });
        console.log('[Notifications] Token saved to Firestore');
      }

      return token;
    } catch (error) {
      console.error('[Notifications] Failed to get FCM token:', error);
      return null;
    }
  }

  /**
   * Initialize notification listeners
   */
  static initialize() {
    // Handle foreground notifications
    messaging().onMessage(async remoteMessage => {
      console.log('[Notifications] Foreground message:', remoteMessage);
      
      // Show alert for foreground notifications
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || '',
          [{ text: 'OK' }]
        );
      }
    });

    // Handle background/quit state notifications
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('[Notifications] Background message:', remoteMessage);
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('[Notifications] App opened from notification:', remoteMessage);
      this.handleNotificationNavigation(remoteMessage);
    });

    // Check if app was opened from a notification (quit state)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('[Notifications] App opened from quit state:', remoteMessage);
          this.handleNotificationNavigation(remoteMessage);
        }
      });

    // Handle token refresh
    messaging().onTokenRefresh(token => {
      console.log('[Notifications] Token refreshed:', token);
      this.getFCMToken();
    });
  }

  /**
   * Handle navigation based on notification data
   */
  static handleNotificationNavigation(remoteMessage: any) {
    const { data } = remoteMessage;
    
    if (!data) return;

    // Navigate based on notification type
    switch (data.type) {
      case 'new_follower':
        // Navigate to profile
        console.log('[Notifications] Navigate to profile:', data.userId);
        break;
      case 'new_like':
        // Navigate to post
        console.log('[Notifications] Navigate to post:', data.postId);
        break;
      case 'new_comment':
        // Navigate to comments
        console.log('[Notifications] Navigate to comments:', data.postId);
        break;
      case 'challenge_invite':
        // Navigate to challenge
        console.log('[Notifications] Navigate to challenge:', data.challengeId);
        break;
      default:
        console.log('[Notifications] Unknown notification type:', data.type);
    }
  }

  /**
   * Subscribe to topic
   */
  static async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`[Notifications] Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`[Notifications] Failed to subscribe to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from topic
   */
  static async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`[Notifications] Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`[Notifications] Failed to unsubscribe from topic ${topic}:`, error);
    }
  }

  /**
   * Delete FCM token
   */
  static async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      console.log('[Notifications] Token deleted');

      // Remove token from Firestore
      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        await db.collection('users').doc(currentUser.uid).update({
          fcmToken: null,
        });
      }
    } catch (error) {
      console.error('[Notifications] Failed to delete token:', error);
    }
  }
}

export default NotificationService;
