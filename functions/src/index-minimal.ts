import { setGlobalOptions } from "firebase-functions/v2";



// Initialize Admin (Moved to lazy loading inside functions)
// admin.initializeApp();

setGlobalOptions({ region: 'us-central1' });

// Import and export notification functions
export {
    onPostLiked,
    onPostCommented,
    onNewFollower,
    onVideoResponse,
    onChallengeInvite
} from './notifications-simple';
