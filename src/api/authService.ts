import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { firebaseAuth } from './firebase';
import { GoogleAuthProvider, FacebookAuthProvider, AppleAuthProvider } from '@react-native-firebase/auth';

class AuthService {
    constructor() {
        // To get your Web Client ID:
        // 1. Go to Firebase Console → Project Settings → General
        // 2. Scroll to "Your apps" → Select Web app (or create one)
        // 3. Copy the Web Client ID
        // OR find it in google-services.json under oauth_client with client_type: 3
        GoogleSignin.configure({
            webClientId: '565139145984-gubqbroreiobcuo1q0t8nc94gl40pck1.apps.googleusercontent.com',
        });
    }

    async signInWithGoogle() {
        try {
            // Check if Google Sign-In is configured correctly
            const hasPlayServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            if (!hasPlayServices) {
                throw new Error('Google Play Services are not available');
            }

            const response = await GoogleSignin.signIn();
            const idToken = response.data?.idToken;

            if (!idToken) {
                // If response.type === 'cancelled', it might not have data.
                throw new Error('No ID token found');
            }

            const googleCredential = GoogleAuthProvider.credential(idToken);
            return await firebaseAuth.signInWithCredential(googleCredential);
        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            if (error.code === '12500') {
                throw new Error('Google Sign-In failed. Please check your Google Web Client ID in the code.');
            }
            throw error;
        }
    }

    async signInWithFacebook() {
        try {
            const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
            if (result.isCancelled) {
                throw new Error('User cancelled the login process');
            }
            const data = await AccessToken.getCurrentAccessToken();
            if (!data) {
                throw new Error('Something went wrong obtaining access token');
            }
            const facebookCredential = FacebookAuthProvider.credential(data.accessToken);
            return await firebaseAuth.signInWithCredential(facebookCredential);
        } catch (error) {
            console.error('Facebook Sign-In Error:', error);
            throw error;
        }
    }

    async signInWithApple() {
        try {
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });

            const { identityToken, nonce } = appleAuthRequestResponse;

            if (!identityToken) {
                throw new Error('Apple Sign-In failed - no identity token returned');
            }

            const appleCredential = AppleAuthProvider.credential(identityToken, nonce);
            return await firebaseAuth.signInWithCredential(appleCredential);
        } catch (error) {
            console.error('Apple Sign-In Error:', error);
            throw error;
        }
    }

    async signInWithPhoneNumber(phoneNumber: string) {
        try {
            return await firebaseAuth.signInWithPhoneNumber(phoneNumber);
        } catch (error) {
            console.error('Phone Sign-In Error:', error);
            throw error;
        }
    }
}

export default new AuthService();
