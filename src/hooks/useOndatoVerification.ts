import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import { ondatoService } from '../services/ondatoService';
import { db, firebaseAuth } from '../api/firebase';
import firestore from '@react-native-firebase/firestore';

interface VerificationConfig {
  dateOfBirth: string;
}

interface VerificationResult {
  success: boolean;
  sessionId?: string;
  identificationId?: string;
  verificationUrl?: string;
  error?: string;
}

interface VerificationStatus {
  status: 'idle' | 'pending' | 'completed' | 'failed' | 'expired';
  sessionId?: string;
  identificationId?: string;
  metadata?: any;
}

export const useOndatoVerification = () => {
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'idle',
  });
  const [error, setError] = useState<string | null>(null);
  
  // Polling state
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionRef = useRef<{ sessionId: string; identificationId: string } | null>(null);

  // Auto-polling effect - polls every 10 seconds when status is pending
  useEffect(() => {
    if (verificationStatus.status === 'pending' && currentSessionRef.current) {
      console.log('[useOndatoVerification] Starting auto-polling...');
      
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Poll immediately
      checkStatus(currentSessionRef.current.sessionId, currentSessionRef.current.identificationId);

      // Then poll every 10 seconds
      pollingIntervalRef.current = setInterval(() => {
        if (currentSessionRef.current) {
          console.log('[useOndatoVerification] Auto-polling status...');
          checkStatus(currentSessionRef.current.sessionId, currentSessionRef.current.identificationId);
        }
      }, 10000); // 10 seconds

      // Cleanup on unmount or status change
      return () => {
        if (pollingIntervalRef.current) {
          console.log('[useOndatoVerification] Stopping auto-polling');
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    } else {
      // Stop polling if status is not pending
      if (pollingIntervalRef.current) {
        console.log('[useOndatoVerification] Stopping polling (status changed)');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [verificationStatus.status]);

  // Start verification process
  const startVerification = useCallback(async (config: VerificationConfig): Promise<VerificationResult> => {
    setLoading(true);
    setError(null);

    try {
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error('User must be logged in');
      }

      // Generate shorter, simpler session ID (Ondato has length/format restrictions)
      const timestamp = Date.now();
      const userIdShort = currentUser.uid.substring(0, 8); // First 8 chars of UID
      const sessionId = `${userIdShort}_${timestamp}`;

      console.log('[useOndatoVerification] Creating session:', sessionId);

      // Call Ondato service via Cloudflare Worker
      const result = await ondatoService.createSession({
        externalReferenceId: sessionId,
        language: 'en',
      });

      if (!result.success || !result.identificationId) {
        throw new Error(result.error || 'Failed to create verification session');
      }

      console.log('[useOndatoVerification] Session created:', result.identificationId);

      // Save verification attempt to Firestore
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await db.collection('verification_attempts').add({
        userId: currentUser.uid,
        sessionId: result.sessionId,
        externalReferenceId: sessionId,
        identificationId: result.identificationId,
        method: 'ondato',
        status: 'pending',
        verificationUrl: result.verificationUrl,
        metadata: {
          dateOfBirth: config.dateOfBirth,
          ondatoIdentificationId: result.identificationId,
        },
        createdAt: firestore.FieldValue.serverTimestamp(),
        expiresAt,
      });

      // Update user profile status
      await db.collection('users').doc(currentUser.uid).update({
        'profileStatus.ageVerification': 'pending',
        'profileStatus.verificationStartedAt': firestore.FieldValue.serverTimestamp(),
      });

      // Store current session for polling
      currentSessionRef.current = {
        sessionId: result.sessionId,
        identificationId: result.identificationId,
      };

      setVerificationStatus({
        status: 'pending',
        sessionId: result.sessionId,
        identificationId: result.identificationId,
      });

      return {
        success: true,
        sessionId: result.sessionId,
        identificationId: result.identificationId,
        verificationUrl: result.verificationUrl,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start verification';
      console.error('[useOndatoVerification] Error:', errorMessage);
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Check verification status
  const checkStatus = useCallback(async (sessionId: string, identificationId: string): Promise<VerificationStatus> => {
    try {
      console.log('[useOndatoVerification] Checking status:', identificationId);

      // Call Ondato service via Cloudflare Worker
      const result = await ondatoService.checkStatus({ identificationId });

      if (!result.success) {
        console.error('[useOndatoVerification] Status check failed:', result.error);
        return {
          status: 'idle',
          sessionId,
          identificationId,
        };
      }

      console.log('[useOndatoVerification] Status:', result.status);

      // Update user profile directly (skip verification_attempts query due to permissions)
      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        // If completed, update user profile
        if (result.status === 'completed') {
          try {
            await db.collection('users').doc(currentUser.uid).update({
              ageVerificationStatus: 'verified',
              'profileStatus.ageVerification': 'verified',
              'profileStatus.verificationCompletedAt': firestore.FieldValue.serverTimestamp(),
            });
            console.log('[useOndatoVerification] ✅ User profile updated: verified');
          } catch (updateError) {
            console.warn('[useOndatoVerification] Could not update user profile:', updateError);
          }
        }

        // If failed, update user profile
        if (result.status === 'failed') {
          try {
            await db.collection('users').doc(currentUser.uid).update({
              ageVerificationStatus: 'rejected',
              'profileStatus.ageVerification': 'rejected',
            });
            console.log('[useOndatoVerification] ❌ User profile updated: rejected');
          } catch (updateError) {
            console.warn('[useOndatoVerification] Could not update user profile:', updateError);
          }
        }
      }

      const status: VerificationStatus = {
        status: result.status || 'idle',
        sessionId,
        identificationId,
        metadata: result.verificationData,
      };

      setVerificationStatus(status);
      return status;
    } catch (err: any) {
      console.error('[useOndatoVerification] Status check error:', err);
      return {
        status: 'idle',
        sessionId,
        identificationId,
      };
    }
  }, []);

  // Open verification in browser
  const openVerification = useCallback(async (verificationUrl: string): Promise<void> => {
    try {
      const canOpen = await Linking.canOpenURL(verificationUrl);

      if (canOpen) {
        await Linking.openURL(verificationUrl);
      } else {
        Alert.alert('Error', 'Unable to open verification link');
      }
    } catch (err: any) {
      console.error('Browser error:', err);
      Alert.alert('Error', 'Failed to open verification browser');
    }
  }, []);

  // Handle deep link
  const handleDeepLink = useCallback((url: string) => {
    if (url.includes('verification-success')) {
      setVerificationStatus(prev => ({
        ...prev,
        status: 'completed',
      }));
      return 'success';
    } else if (url.includes('verification-failed')) {
      setVerificationStatus(prev => ({
        ...prev,
        status: 'failed',
      }));
      return 'failed';
    }
    return null;
  }, []);

  // Reset verification state
  const reset = useCallback(() => {
    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    currentSessionRef.current = null;
    
    setVerificationStatus({ status: 'idle' });
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    verificationStatus,
    error,
    startVerification,
    checkStatus,
    openVerification,
    handleDeepLink,
    reset,
  };
};

export default useOndatoVerification;
