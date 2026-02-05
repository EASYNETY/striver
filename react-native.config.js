module.exports = {
    dependencies: {
        // Disable all Firebase modules for iOS
        '@react-native-firebase/app': {
            platforms: { ios: null },
        },
        '@react-native-firebase/analytics': {
            platforms: { ios: null },
        },
        '@react-native-firebase/app-check': {
            platforms: { ios: null },
        },
        '@react-native-firebase/auth': {
            platforms: { ios: null },
        },
        '@react-native-firebase/firestore': {
            platforms: { ios: null },
        },
        '@react-native-firebase/functions': {
            platforms: { ios: null },
        },
        '@react-native-firebase/storage': {
            platforms: { ios: null },
        },
        // Disable Stripe for iOS
        '@stripe/stripe-react-native': {
            platforms: { ios: null },
        },
        // Disable other potentially problematic modules
        'react-native-fbsdk-next': {
            platforms: { ios: null },
        },
        '@react-native-google-signin/google-signin': {
            platforms: { ios: null },
        },
        '@invertase/react-native-apple-authentication': {
            platforms: { ios: null },
        },
    },
};