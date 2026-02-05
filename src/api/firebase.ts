import { getApp, getApps, initializeApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';
import { getFunctions } from '@react-native-firebase/functions';
import { getAnalytics } from '@react-native-firebase/analytics';

// Initialize the default app if not already initialized
let app;
if (getApps().length === 0) {
    app = initializeApp();
} else {
    app = getApp();
}

// Export modular instances (Linking them to the app instance)
export const db = getFirestore(app);
export const modularDb = db;
export const firebaseAuth = getAuth(app);
export const firebaseStorage = getStorage(app);
export const cloudFunctions = getFunctions(app, 'us-central1');
export const firebaseAnalytics = getAnalytics(app);

export const initAppCheck = async () => {
    console.log('App Check disabled for debugging');
};

export default {
    db,
    auth: firebaseAuth,
    storage: firebaseStorage,
    functions: cloudFunctions,
    analytics: firebaseAnalytics,
};
