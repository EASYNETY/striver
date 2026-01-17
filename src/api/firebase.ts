import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';
import analytics from '@react-native-firebase/analytics';
import appCheck from '@react-native-firebase/app-check';

// Note: Ensure you have your google-services.json (Android) 
// and GoogleService-Info.plist (iOS) in the respective native folders.

export const db = firestore();
export const firebaseAuth = auth();
export const firebaseStorage = storage();
export let cloudFunctions: any;
try {
    cloudFunctions = functions();
} catch (e) {
    console.warn('Firebase Functions not initialized:', e);
}
export const firebaseAnalytics = analytics();

export const initAppCheck = async () => {
    // const provider = appCheck().newReactNativeFirebaseAppCheckProvider();
    // provider.configure({
    //     android: {
    //         provider: 'debug', // Change to 'playIntegrity' for production
    //     },
    //     apple: {
    //         provider: 'debug', // Change to 'deviceCheck' or 'appAttest' for production
    //     },
    // });
    // await appCheck().activate(provider, true);
    console.log('App Check disabled for debugging');
};

export default {
    db,
    auth: firebaseAuth,
    storage: firebaseStorage,
    functions: cloudFunctions,
    analytics: firebaseAnalytics,
};
