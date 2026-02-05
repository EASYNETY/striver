import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { logEvent, EVENTS } from '../../utils/analytics';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';
import { db, firebaseAuth } from '../../api/firebase';
import { useOndatoVerification } from '../../hooks/useOndatoVerification';
import firestore from '@react-native-firebase/firestore';
import { WebView } from 'react-native-webview';

interface OndatoVerificationProps {
  navigation: any;
  route: any;
}

const OndatoVerification: React.FC<OndatoVerificationProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { uid: routeUid, dateOfBirth, accountType } = route.params || {};

  // Use currently logged in UID as fallback if route param is missing
  const uid = routeUid || firebaseAuth.currentUser?.uid;

  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'success' | 'failed' | 'timeout' | 'webview_active' | 'already_verified'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [identificationId, setIdentificationId] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [useWebView, setUseWebView] = useState(true); // Toggle for WebView vs external browser
  const [checkingExistingStatus, setCheckingExistingStatus] = useState(true);

  const appState = useRef(AppState.currentState);
  const verificationInProgress = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Use the hook
  const { startVerification: startVerificationHook, checkStatus: checkStatusHook } = useOndatoVerification();

  // Check if user is already verified on mount
  useEffect(() => {
    const checkExistingVerification = async () => {
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData?.ageVerificationStatus === 'verified') {
            console.log('[OndatoVerification] User already verified, showing status');
            setVerificationStatus('already_verified');
          }
        }
      } catch (error) {
        console.error('[OndatoVerification] Error checking existing verification:', error);
      } finally {
        setCheckingExistingStatus(false);
      }
    };

    checkExistingVerification();
  }, [uid]);

  useEffect(() => {
    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Listen for app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Listen for User Profile changes ONLY if verification is in progress
    let userUnsubscribe: (() => void) | undefined;

    if (verificationInProgress.current && sessionId) {
      userUnsubscribe = db.collection('users').doc(uid).onSnapshot((snapshot) => {
        if (snapshot.exists) {
          const userData = snapshot.data();
          if (userData?.ageVerificationStatus === 'verified') {
            console.log('User verified via profile sync!');
            handleVerificationSuccess();
          }
        }
      });
    }

    return () => {
      subscription.remove();
      appStateSubscription.remove();
      if (userUnsubscribe) {
        userUnsubscribe();
      }
      stopListener();
    };
  }, [sessionId, uid, verificationInProgress.current]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      verificationInProgress.current &&
      sessionId &&
      identificationId
    ) {
      console.log('App returned to active - triggering sync...');
      checkStatus();
    }
    appState.current = nextAppState;
  };

  const checkStatus = async () => {
    if (!sessionId || !identificationId) return;

    setIsSyncing(true);
    try {
      console.log('[OndatoVerification] Checking status for:', identificationId);

      const result = await checkStatusHook(sessionId, identificationId);

      if (result.status === 'completed') {
        handleVerificationSuccess();
      } else if (result.status === 'failed') {
        handleVerificationFailure();
      }
    } catch (error: any) {
      console.error('[OndatoVerification] Error checking status:', error);

      // Fallback: check user profile directly
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists && userDoc.data()?.ageVerificationStatus === 'verified') {
        handleVerificationSuccess();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeepLink = ({ url }: { url: string }) => {
    console.log('Ondato Deep Link:', url);
    if (url.includes('verification-success')) {
      handleVerificationSuccess();
    } else if (url.includes('verification-failed')) {
      handleVerificationFailure();
    } else if (url.includes('verification-cancelled')) {
      handleVerificationCancelled();
    }
  };

  const startVerification = async () => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'Session lost. Please sign in again.');
      navigation.navigate('Welcome');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      console.log('[OndatoVerification] Starting verification...');

      const result = await startVerificationHook({ dateOfBirth });

      if (!result.success || !result.verificationUrl) {
        throw new Error(result.error || 'Failed to start verification');
      }

      console.log('[OndatoVerification] Verification started:', result.sessionId);

      setSessionId(result.sessionId || null);
      setIdentificationId(result.identificationId || null);
      setVerificationUrl(result.verificationUrl);

      // Use WebView if available, otherwise fallback to external browser
      if (useWebView) {
        setVerificationStatus('webview_active');
        startListener();
      } else {
        openOndato(result.verificationUrl);
      }
    } catch (error: any) {
      console.error('[OndatoVerification] Error:', error);
      Alert.alert('Error', error.message || 'Failed to start verification');
    } finally {
      setLoading(false);
    }
  };

  const openOndato = async (url: string) => {
    setVerificationStatus('pending');
    verificationInProgress.current = true;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      startListener();
    } else {
      Alert.alert('Error', 'Could not open verification browser.');
      setVerificationStatus('idle');
    }
  };

  const startListener = () => {
    if (!sessionId) return;
    stopListener();

    // Listen to user profile changes instead of verification_attempts (due to permissions)
    unsubscribeRef.current = db.collection('users')
      .doc(uid)
      .onSnapshot((snapshot) => {
        if (snapshot.exists) {
          const userData = snapshot.data();
          const verificationStatus = userData?.ageVerificationStatus;

          if (verificationStatus === 'verified') {
            handleVerificationSuccess();
          } else if (verificationStatus === 'rejected') {
            handleVerificationFailure();
          }
        }
      }, (error) => {
        console.error('Snapshot listener error:', error);
      });
  };

  const stopListener = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  };

  const handleVerificationSuccess = async () => {
    if (verificationStatus === 'success') return; // Prevent double trigger

    verificationInProgress.current = false;
    stopListener();
    setVerificationStatus('success');

    try {
      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        await db.collection('users').doc(currentUser.uid).update({
          ageVerificationStatus: 'verified',
          ageVerificationMethod: 'ondato',
          ageVerificationDate: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }

    logEvent(EVENTS.SIGNUP_COMPLETED, {
      method: 'ondato_verification',
      account_type: accountType
    });

    setTimeout(() => {
      navigation.navigate('InterestsSelection', { uid });
    }, 2000);
  };

  const handleVerificationFailure = () => {
    verificationInProgress.current = false;
    stopListener();
    setVerificationStatus('failed');
  };

  const handleVerificationCancelled = () => {
    verificationInProgress.current = false;
    stopListener();
    setVerificationStatus('idle');
  };

  const renderContent = () => {
    // WebView Active - In-App Verification
    if (verificationStatus === 'webview_active' && verificationUrl) {
      return (
        <View style={styles.webviewContainer}>
          <View style={styles.webviewHeader}>
            <Text style={styles.webviewTitle}>Identity Verification</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Cancel Verification?',
                  'Are you sure you want to cancel?',
                  [
                    { text: 'Continue', style: 'cancel' },
                    { text: 'Cancel', onPress: handleVerificationCancelled },
                  ]
                );
              }}
              style={styles.webviewCloseBtn}
            >
              <X color={COLORS.white} size={24} />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: verificationUrl }}
            style={styles.webview}
            // Camera & Hardware Props
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            originWhitelist={['*']}
            // Permissions
            androidLayerType="hardware"
            mixedContentMode="always"

            onLoadStart={() => console.log('[WebView] Loading started')}
            onLoadEnd={() => console.log('[WebView] Loading ended')}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('[WebView] Error:', nativeEvent);
              // Don't fail immediately on minor errors
              if (nativeEvent.description?.includes('net::ERR_UNKNOWN_URL_SCHEME') || nativeEvent.description?.includes('striver://')) {
                // Ignore redirect loop errors if they are just deep links
                return;
              }
            }}
            onNavigationStateChange={(navState) => {
              console.log('[WebView] Navigation:', navState.url);

              // Handle custom schemes (ondato success/fail urls)
              if (navState.url.startsWith('striver://')) {
                // It's a deep link, we should handle it and stop loading
                if (navState.url.includes('verification-success')) {
                  handleVerificationSuccess();
                } else if (navState.url.includes('verification-failed')) {
                  handleVerificationFailure();
                }
                return;
              }

              // Check for success/failure URLs (standard HTTP redirects if deep link fails)
              // IMPORTANT: Must ensure we don't match the query param in the initial URL

              if ((navState.url.includes('verification-success') && !navState.url.includes('successUrl='))) {
                handleVerificationSuccess();
              } else if ((navState.url.includes('verification-failed') && !navState.url.includes('failureUrl='))) {
                handleVerificationFailure();
              }
            }}
            onShouldStartLoadWithRequest={(request) => {
              // Intercept striver:// links
              if (request.url.startsWith('striver://')) {
                console.log('[WebView] Intercepted Deep Link:', request.url);
                if (request.url.includes('verification-success')) {
                  handleVerificationSuccess();
                } else if (request.url.includes('verification-failed')) {
                  handleVerificationFailure();
                }
                return false; // STOP loading (handled internally)
              }
              return true; // Continue loading other URLs
            }}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.webviewLoadingText}>Loading verification...</Text>
              </View>
            )}
          />
        </View>
      );
    }

    switch (verificationStatus) {
      case 'already_verified':
        return (
          <View style={styles.statusContainer}>
            <View style={styles.successIconBox}>
              <CheckCircle2 color={COLORS.primary} size={64} />
            </View>
            <Text style={styles.statusTitle}>Already Verified!</Text>
            <Text style={styles.statusDesc}>
              Your identity has already been verified. You can proceed to the next step.
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => navigation.navigate('InterestsSelection', { uid })}
            >
              <Text style={styles.retryBtnText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manualCheckBtn}
              onPress={() => setVerificationStatus('idle')}
            >
              <Text style={styles.manualCheckBtnText}>Verify Again</Text>
            </TouchableOpacity>
          </View>
        );

      case 'success':
        return (
          <View style={styles.statusContainer}>
            <View style={styles.successIconBox}>
              <CheckCircle2 color={COLORS.primary} size={64} />
            </View>
            <Text style={styles.statusTitle}>Verification Successful!</Text>
            <Text style={styles.statusDesc}>
              Your identity has been verified. Welcome back!
            </Text>
          </View>
        );

      case 'failed':
        return (
          <View style={styles.statusContainer}>
            <View style={styles.errorIconBox}>
              <AlertCircle color="#FF3B30" size={64} />
            </View>
            <Text style={styles.statusTitle}>Verification Failed</Text>
            <Text style={styles.statusDesc}>We couldn't verify your age. Please try again with clear lighting.</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => setVerificationStatus('idle')}
            >
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );

      case 'pending':
        return (
          <View style={styles.statusContainer}>
            {isSyncing ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <View style={styles.pendingIconBox}>
                <RefreshCw color={COLORS.primary} size={64} />
              </View>
            )}
            <Text style={styles.statusTitle}>
              {isSyncing ? 'Checking Status...' : 'Verify Finished?'}
            </Text>
            <Text style={styles.statusDesc}>
              If you finished the check in your browser, tap refresh below to continue.
            </Text>

            <TouchableOpacity
              style={[styles.retryBtn, isSyncing && { opacity: 0.7 }]}
              onPress={checkStatus}
              disabled={isSyncing}
            >
              <Text style={styles.retryBtnText}>
                {isSyncing ? 'Syncing...' : 'Refresh Status Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualCheckBtn}
              onPress={() => {
                Alert.alert(
                  'Continue?',
                  'You can move on and we\'ll verify you in the background.',
                  [
                    { text: 'Wait more' },
                    { text: 'Continue Anyway', onPress: () => navigation.navigate('InterestsSelection', { uid }) },
                  ]
                );
              }}
            >
              <Text style={styles.manualCheckBtnText}>Skip and Continue</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        // Show loading while checking existing verification status
        if (checkingExistingStatus) {
          return (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.statusTitle}>Checking Status...</Text>
            </View>
          );
        }

        return (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <ShieldCheck color={COLORS.primary} size={48} />
              </View>
            </View>

            <Text style={styles.title}>Secure Age Check</Text>
            <Text style={styles.subtitle}>
              Striver uses Ondato for ultra-secure identity verification. This keeps our community safe for everyone.
            </Text>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={startVerification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.primaryBtnText}>Start Verification</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              By clicking start, you will be redirected to Ondato's secure platform. Striver does not store copies of your ID documents.
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <DiagonalStreaksBackground />
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.white} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Age Verification</Text>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginLeft: SPACING.sm },
  content: { flex: 1, padding: SPACING.xl, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: SPACING.xl },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(143, 251, 185, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(143, 251, 185, 0.2)' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.white, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xxl, lineHeight: 24 },
  primaryBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.background },
  disclaimer: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.lg, paddingHorizontal: SPACING.md },
  statusContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  successIconBox: { width: 120, height: 120, backgroundColor: 'rgba(143, 251, 185, 0.1)', borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  errorIconBox: { width: 120, height: 120, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  pendingIconBox: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl, backgroundColor: 'rgba(143, 251, 185, 0.05)' },
  statusTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white, textAlign: 'center', marginBottom: SPACING.sm },
  statusDesc: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  retryBtn: { marginTop: SPACING.xl, height: 56, paddingHorizontal: SPACING.xxl, backgroundColor: COLORS.primary, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  retryBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.background },
  manualCheckBtn: { marginTop: SPACING.xl, paddingVertical: SPACING.md },
  manualCheckBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, textDecorationLine: 'underline' },
  webviewContainer: { flex: 1, backgroundColor: COLORS.background },
  webviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  webviewTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  webviewCloseBtn: { padding: SPACING.sm },
  webview: { flex: 1, backgroundColor: COLORS.background },
  webviewLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  webviewLoadingText: { fontSize: 16, color: COLORS.white, marginTop: SPACING.md },
  webviewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  webviewPlaceholderText: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xl },
  fallbackBtn: { marginTop: SPACING.xl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  fallbackBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, textDecorationLine: 'underline' },
});

export default OndatoVerification;
