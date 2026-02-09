import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from 'firebase-admin';

// Initialize Admin
if (admin.apps.length === 0) {
    admin.initializeApp();
}

setGlobalOptions({ region: 'us-central1' });

/**
 * NOTIFICATION FUNCTIONS ONLY
 * This is a minimal index file that only exports notification functions
 * to avoid deployment timeouts caused by other module imports
 */

// Import and export notification functions
export { 
    onPostLiked, 
    onPostCommented, 
    onNewFollower, 
    onVideoResponse, 
    onChallengeInvite 
} from './notifications';
