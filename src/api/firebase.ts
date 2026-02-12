import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';
import analytics from '@react-native-firebase/analytics';

// React Native Firebase automatically initializes the default app
// No need to call initializeApp() manually

// Export compat API instances (React Native Firebase default API)
export const db = firestore();
export const modularDb = db; // Alias for compatibility with existing code
export const firebaseAuth = auth();
export const firebaseStorage = storage();
export const cloudFunctions = functions().httpsCallable;
export const firebaseAnalytics = analytics();

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
