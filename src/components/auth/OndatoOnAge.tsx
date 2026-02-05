import React, { useEffect } from 'react';
import { Linking, Alert } from 'react-native';

/**
 * OndatoOnAge Component
 * 
 * Handles opening the Ondato verification URL and listening for deep link returns.
 * Note: The user requested expo-web-browser, but since it's not in the current package.json,
 * we use Linking.openURL which is the standard React Native way to open the browser.
 */
interface OndatoOnAgeProps {
    verificationUrl: string;
    onSuccess: () => void;
    onFailure: (error?: string) => void;
}

export const OndatoOnAge: React.FC<OndatoOnAgeProps> = ({
    verificationUrl,
    onSuccess,
    onFailure
}) => {
    useEffect(() => {
        // Listen for deep links returning from Ondato
        const handleDeepLink = ({ url }: { url: string }) => {
            console.log('Deep link received:', url);

            if (url.includes('verification-success')) {
                onSuccess();
            } else if (url.includes('verification-failed')) {
                onFailure('Verification failed according to deep link');
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Open the verification URL
        const startFlow = async () => {
            try {
                const canOpen = await Linking.canOpenURL(verificationUrl);
                if (canOpen) {
                    await Linking.openURL(verificationUrl);
                } else {
                    onFailure('Cannot open verification URL');
                }
            } catch (error: any) {
                console.error('Ondato browser error:', error);
                onFailure(error.message);
            }
        };

        startFlow();

        return () => {
            subscription.remove();
        };
    }, [verificationUrl, onSuccess, onFailure]);

    // This component handles the side effect of opening the browser
    return null;
};

export default OndatoOnAge;
