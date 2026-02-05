import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Keyboard,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, Check } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { firebaseAuth } from '../../api/firebase';
import userService from '../../api/userService';
import { logEvent, EVENTS } from '../../utils/analytics';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const PhoneAuthScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { accountType = 'individual', mode = 'signup' } = route.params || {};

  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [countryFlag, setCountryFlag] = useState('🇺🇸');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const codeInputRefs = useRef<Array<TextInput | null>>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const loaderScale = useRef(new Animated.Value(0)).current;
  const loaderRotate = useRef(new Animated.Value(0)).current;

  const isLogin = mode === 'login';

  // Popular countries list
  const countries = [
    { code: '+1', flag: '🇺🇸', name: 'United States', maxLength: 10 },
    { code: '+1', flag: '🇨🇦', name: 'Canada', maxLength: 10 },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom', maxLength: 10 },
    { code: '+91', flag: '🇮🇳', name: 'India', maxLength: 10 },
    { code: '+86', flag: '🇨🇳', name: 'China', maxLength: 11 },
    { code: '+81', flag: '🇯🇵', name: 'Japan', maxLength: 10 },
    { code: '+49', flag: '🇩🇪', name: 'Germany', maxLength: 11 },
    { code: '+33', flag: '🇫🇷', name: 'France', maxLength: 9 },
    { code: '+39', flag: '🇮🇹', name: 'Italy', maxLength: 10 },
    { code: '+34', flag: '🇪🇸', name: 'Spain', maxLength: 9 },
    { code: '+7', flag: '🇷🇺', name: 'Russia', maxLength: 10 },
    { code: '+55', flag: '🇧🇷', name: 'Brazil', maxLength: 11 },
    { code: '+52', flag: '🇲🇽', name: 'Mexico', maxLength: 10 },
    { code: '+61', flag: '🇦🇺', name: 'Australia', maxLength: 9 },
    { code: '+27', flag: '🇿🇦', name: 'South Africa', maxLength: 9 },
    { code: '+234', flag: '🇳🇬', name: 'Nigeria', maxLength: 10 },
    { code: '+20', flag: '🇪🇬', name: 'Egypt', maxLength: 10 },
    { code: '+971', flag: '🇦🇪', name: 'UAE', maxLength: 9 },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia', maxLength: 9 },
    { code: '+82', flag: '🇰🇷', name: 'South Korea', maxLength: 10 },
    { code: '+65', flag: '🇸🇬', name: 'Singapore', maxLength: 8 },
    { code: '+60', flag: '🇲🇾', name: 'Malaysia', maxLength: 10 },
    { code: '+62', flag: '🇮🇩', name: 'Indonesia', maxLength: 11 },
    { code: '+63', flag: '🇵🇭', name: 'Philippines', maxLength: 10 },
    { code: '+84', flag: '🇻🇳', name: 'Vietnam', maxLength: 10 },
    { code: '+66', flag: '🇹🇭', name: 'Thailand', maxLength: 9 },
    { code: '+92', flag: '🇵🇰', name: 'Pakistan', maxLength: 10 },
    { code: '+880', flag: '🇧🇩', name: 'Bangladesh', maxLength: 10 },
    { code: '+90', flag: '🇹🇷', name: 'Turkey', maxLength: 10 },
    { code: '+48', flag: '🇵🇱', name: 'Poland', maxLength: 9 },
  ];

  const currentCountry = countries.find(c => c.code === countryCode && c.flag === countryFlag) || countries[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  useEffect(() => {
    if (sendingCode) {
      // Animate loader
      Animated.sequence([
        Animated.timing(loaderScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(loaderRotate, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      loaderScale.setValue(0);
      loaderRotate.setValue(0);
    }
  }, [sendingCode]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    // Format based on country
    if (countryCode === '+1') {
      // US/Canada format
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    // Default format for other countries
    return cleaned;
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= currentCountry.maxLength) {
      setPhoneNumber(cleaned);
    }
  };

  const handleCountrySelect = (country: typeof countries[0]) => {
    setCountryCode(country.code);
    setCountryFlag(country.flag);
    setPhoneNumber('');
    setShowCountryPicker(false);
  };

  const handleSendCode = async () => {
    if (phoneNumber.length < 8) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    setSendingCode(true);
    Keyboard.dismiss();

    try {
      const fullNumber = `${countryCode}${phoneNumber}`;

      // Send verification code
      const confirmationResult = await firebaseAuth.signInWithPhoneNumber(fullNumber);
      setConfirmation(confirmationResult);

      // Wait a bit for smooth transition
      await new Promise(resolve => setTimeout(resolve, 800));

      setSendingCode(false);
      setStep('code');
      setResendTimer(60);
      logEvent(EVENTS.SIGNUP_COMPLETED, { method: 'phone_started', phone: fullNumber });

      // Auto-focus first code input
      setTimeout(() => codeInputRefs.current[0]?.focus(), 300);
    } catch (error: any) {
      console.error('Phone auth error:', error);
      setSendingCode(false);

      // Handle specific error codes
      let errorMessage = 'Failed to send verification code';

      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please check and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'Security verification failed. Please try again.';
      } else if (error.code === 'auth/unknown' || error.message?.includes('Error code:39')) {
        errorMessage = 'Unable to send verification code. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const pastedCode = text.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setCode(newCode);

      // Focus last filled input or verify if complete
      const lastIndex = Math.min(index + pastedCode.length - 1, 5);
      if (lastIndex === 5 && newCode.every(c => c !== '')) {
        Keyboard.dismiss();
        handleVerifyCode(newCode.join(''));
      } else {
        codeInputRefs.current[lastIndex]?.focus();
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-advance to next input
    if (text && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (index === 5 && text && newCode.every(c => c !== '')) {
      Keyboard.dismiss();
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');

    if (codeToVerify.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await confirmation.confirm(codeToVerify);

      if (userCredential.user) {
        // Check if user profile exists
        const profile = await userService.getUserProfile(userCredential.user.uid);

        if (isLogin) {
          // LOGIN MODE: User should already have a profile
          if (!profile) {
            Alert.alert('New Here?', 'We don\'t have an account with that number yet. Ready to join the squad?');
            setLoading(false);
            return;
          }

          // Check if onboarding is complete
          if (!profile.onboardingComplete) {
            // Resume onboarding - phone login goes to DateOfBirth
            navigation.replace('DateOfBirth', {
              uid: userCredential.user.uid,
              accountType: profile.accountType,
              signupMethod: 'phone'
            });
          } else {
            // Onboarding complete - App.tsx will handle navigation to Main
            logEvent(EVENTS.LOGIN, { method: 'phone' });
          }
        } else {
          // SIGNUP MODE: Create profile if it doesn't exist
          if (!profile) {
            await userService.createUserProfile(userCredential.user.uid, {
              phoneNumber: `${countryCode}${phoneNumber}`,
              accountType,
            });
          }

          logEvent(EVENTS.SIGNUP_COMPLETED, { method: 'phone', account_type: accountType });

          // Phone signup goes to DateOfBirth screen
          navigation.replace('DateOfBirth', {
            uid: userCredential.user.uid,
            accountType,
            signupMethod: 'phone'
          });
        }
      }
    } catch (error: any) {
      console.error('Code verification error:', error);
      Alert.alert('Not Quite!', 'That code didn\'t match. Double-check and try again!');
      setCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const fullNumber = `${countryCode}${phoneNumber}`;
      const confirmationResult = await firebaseAuth.signInWithPhoneNumber(fullNumber);
      setConfirmation(confirmationResult);
      setResendTimer(60);
      setCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
      Alert.alert('Fresh Code Incoming!', 'Check your phone - new code just dropped!');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'code') {
      setStep('phone');
      setCode(['', '', '', '', '', '']);
      setConfirmation(null);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <DiagonalStreaksBackground />
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ChevronLeft color={COLORS.white} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'phone'
            ? (isLogin ? 'Log In with Phone' : 'Phone Number')
            : 'Verification Code'}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {step === 'phone' ? (
          <>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Phone color={COLORS.primary} size={32} />
              </View>
            </View>

            <Text style={styles.title}>Enter your phone number</Text>
            <Text style={styles.subtitle}>
              We'll send you a verification code to confirm your number
            </Text>

            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={styles.countryCodeBtn}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.countryFlag}>{countryFlag}</Text>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
              </TouchableOpacity>

              <View style={styles.phoneInputBox}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder={countryCode === '+1' ? '(555) 123-4567' : 'Phone number'}
                  placeholderTextColor={COLORS.textSecondary}
                  value={formatPhoneNumber(phoneNumber)}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={countryCode === '+1' ? 14 : currentCountry.maxLength}
                  autoFocus
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, phoneNumber.length < 8 && styles.btnDisabled]}
              onPress={handleSendCode}
              disabled={sendingCode || phoneNumber.length < 8}
            >
              {sendingCode ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.primaryBtnText}>Send Code</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              By continuing, you agree to receive SMS messages from Striver. Message and data rates may apply.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Check color={COLORS.primary} size={32} />
              </View>
            </View>

            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.phoneHighlight}>
                {countryCode} {formatPhoneNumber(phoneNumber)}
              </Text>
            </Text>

            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => (codeInputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    digit && styles.codeInputFilled,
                  ]}
                  value={digit}
                  onChangeText={text => handleCodeChange(text, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.resendBtn, resendTimer > 0 && styles.resendBtnDisabled]}
              onPress={handleResendCode}
              disabled={resendTimer > 0 || loading}
            >
              <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>

            {loading && (
              <View style={styles.verifyingContainer}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.verifyingText}>Verifying...</Text>
              </View>
            )}
          </>
        )}
      </Animated.View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={countries}
              keyExtractor={(item, index) => `${item.code}-${item.flag}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    item.code === countryCode && item.flag === countryFlag && styles.countryItemSelected
                  ]}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Fancy Sending Code Loader */}
      {sendingCode && (
        <Animated.View
          style={[
            styles.loaderOverlay,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Animated.View
            style={[
              styles.loaderContainer,
              {
                transform: [
                  { scale: loaderScale },
                  {
                    rotate: loaderRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.loaderRing} />
            <View style={[styles.loaderRing, styles.loaderRingInner]} />
            <Phone color={COLORS.primary} size={32} />
          </Animated.View>
          <Animated.Text
            style={[
              styles.loaderText,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            Sending verification code...
          </Animated.Text>
          <Animated.Text
            style={[
              styles.loaderSubtext,
              {
                opacity: fadeAnim,
              }
            ]}
          >
            {countryFlag} {countryCode} {formatPhoneNumber(phoneNumber)}
          </Animated.Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(143, 251, 185, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(143, 251, 185, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 24,
  },
  phoneHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  countryCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 56,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  countryFlag: {
    fontSize: 24,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  phoneInputBox: {
    flex: 1,
    height: 56,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  phoneInput: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  codeInput: {
    flex: 1,
    height: 64,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(143, 251, 185, 0.05)',
  },
  primaryBtn: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  resendBtn: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  resendBtnDisabled: {
    opacity: 0.5,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  resendTextDisabled: {
    color: COLORS.textSecondary,
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  verifyingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalClose: {
    fontSize: 28,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  countryItemSelected: {
    backgroundColor: 'rgba(143, 251, 185, 0.1)',
  },
  countryItemFlag: {
    fontSize: 28,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
  countryItemCode: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  loaderRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  loaderRingInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(143, 251, 185, 0.3)',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  loaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  loaderSubtext: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
});

export default PhoneAuthScreen;
