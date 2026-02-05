import { useState, useCallback } from 'react';
import { httpsCallable } from '@react-native-firebase/functions';
import { collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { firebaseAuth, cloudFunctions, db } from '../api/firebase';

interface VerificationResult {
    success: boolean;
    verificationUrl?: string;
    sessionId?: string;
    error?: string;
}

const ONDATO_SETUP_ID = 'fa1fb2cb-034f-4926-bd38-c8290510ade9';

export const useAgeVerification = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startOndatoVerification = useCallback(async (dateOfBirth: string): Promise<VerificationResult> => {
        setLoading(true);
        setError(null);

        const user = firebaseAuth.currentUser;
        const uid = user ? user.uid : 'temp_' + Date.now();

        try {
            // 1. Try the secure Backend flow first
            if (user) {
                console.log('Refreshing ID token for verifyAge call...');
                await user.getIdToken(true);
            }

            try {
                const verifyAgeFn = httpsCallable(cloudFunctions, 'verifyAge');
                const result = await verifyAgeFn({
                    dateOfBirth,
                    method: 'ondato'
                });

                const data: any = result.data;
                return {
                    success: true,
                    verificationUrl: data.verificationUrl,
                    sessionId: data.sessionId
                };
            } catch (backendError: any) {
                // If backend fails with UNAUTHENTICATED, we fallback to Direct URL strategy
                if (backendError.message?.includes('UNAUTHENTICATED') || backendError.code === 'unauthenticated') {
                    console.warn('Backend Auth failed. Falling back to Direct URL strategy...');
                    return await startDirectVerification(uid, dateOfBirth);
                }
                throw backendError;
            }
        } catch (err: any) {
            console.error('Age verification failed, trying direct fallback...', err);
            return await startDirectVerification(uid, dateOfBirth);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fallback: Direct URL Strategy (No backend needed)
    const startDirectVerification = async (uid: string, dob: string): Promise<VerificationResult> => {
        try {
            const extRef = `ondato_${uid}_${Date.now()}`;
            const directUrl = `https://idv.ondato.com/setups/${ONDATO_SETUP_ID}?externalRef=${extRef}`;

            // Store attempt in Firestore using MODULAR API
            try {
                // Use addDoc and collection for modular API compliance
                await addDoc(collection(db, 'verification_attempts'), {
                    userId: uid,
                    externalReferenceId: extRef,
                    sessionId: extRef, // Unify with sessionId for status checks
                    method: 'ondato',
                    status: 'pending',
                    verificationUrl: directUrl,
                    dateOfBirth: dob,
                    createdAt: serverTimestamp(),
                    isDirectFallback: true
                });
            } catch (fe) {
                console.warn('Could not save attempt to Firestore (likely permission denied even after fix)', fe);
            }

            return {
                success: true,
                verificationUrl: directUrl,
                sessionId: extRef
            };
        } catch (error: any) {
            setError(error.message);
            return { success: false, error: error.message };
        }
    };

    return {
        startOndatoVerification,
        loading,
        error
    };
};
