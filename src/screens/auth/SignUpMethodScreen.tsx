import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, Mail, Apple as AppleIcon } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import authService from '../../api/authService';
import userService from '../../api/userService';
import { logEvent, EVENTS } from '../../utils/analytics';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

// Google Icon Component
const GoogleIcon = ({ size = 24, color = COLORS.white }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color, fontWeight: 'bold', fontSize: size * 0.8 }}>G</Text>
  </View>
);

// Facebook Icon Component
const FacebookIcon = ({ size = 24, color = COLORS.white }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color, fontWeight: 'bold', fontSize: size * 0.8 }}>f</Text>
  </View>
);

const SignUpMethodScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { accountType = 'individual', mode = 'signup' } = route.params || {};
  const [loading, setLoading] = useState(false);

  const accountTypeLabel = accountType === 'family' ? 'Family Account' : 'Individual Account';
  const isLogin = mode === 'login';

  const handleSocialAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    try {
      let userCredential;
      if (provider === 'google') userCredential = await authService.signInWithGoogle();
      else if (provider === 'facebook') userCredential = await authService.signInWithFacebook();
      else if (provider === 'apple') userCredential = await authService.signInWithApple();

      if (userCredential?.user) {
        const profile = await userService.getUserProfile(userCredential.user.uid);
        if (!profile) {
          await userService.createUserProfile(userCredential.user.uid, {
            email: userCredential.user.email || '',
            displayName: userCredential.user.displayName || '',
            avatar: userCredential.user.photoURL || '',
            accountType,
          });
        }
        logEvent(EVENTS.SIGNUP_COMPLETED, { method: provider, account_type: accountType });
      }
    } catch (error: any) {
      console.error(`${provider} auth error:`, error);
      if (error.code !== 'E_SIGN_IN_CANCELLED' && error.message !== 'User cancelled the login process') {
        Alert.alert('Authentication Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <DiagonalStreaksBackground />
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.white} size={28} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Sign Up</Text>
          <Text style={styles.headerSubtitle}>{accountTypeLabel}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Choose your sign up method</Text>
          <Text style={styles.subtitle}>Pick the option that works best for you</Text>
        </View>

        <View style={styles.methodsContainer}>
          {/* Phone Auth */}
          <TouchableOpacity
            style={styles.methodBtn}
            onPress={() => navigation.navigate('PhoneAuth', { accountType, mode })}
            disabled={loading}
          >
            <View style={styles.methodIconContainer}>
              <Phone color={COLORS.primary} size={24} />
            </View>
            <View style={styles.methodTextContainer}>
              <Text style={styles.methodTitle}>Continue with Phone</Text>
              <Text style={styles.methodDesc}>
                {isLogin ? 'Log in using your phone number' : 'Sign up using your phone number'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Email Auth */}
          <TouchableOpacity
            style={styles.methodBtn}
            onPress={() => navigation.navigate('SignUp', { accountType, mode })}
            disabled={loading}
          >
            <View style={[styles.methodIconContainer, { backgroundColor: 'rgba(10, 132, 255, 0.1)' }]}>
              <Mail color="#0A84FF" size={24} />
            </View>
            <View style={styles.methodTextContainer}>
              <Text style={styles.methodTitle}>Continue with Email</Text>
              <Text style={styles.methodDesc}>
                {isLogin ? 'Log in using your email address' : 'Sign up using your email address'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.line} />
          </View>

          {/* Social Auth Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleSocialAuth('google')}
              disabled={loading}
            >
              <GoogleIcon size={24} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleSocialAuth('facebook')}
              disabled={loading}
            >
              <FacebookIcon size={24} />
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleSocialAuth('apple')}
                disabled={loading}
              >
                <AppleIcon color={COLORS.white} size={24} />
              </TouchableOpacity>
            )}
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Signing you up...</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to Striver's Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
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
  headerTextContainer: {
    marginLeft: SPACING.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.display.bold,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.body.medium,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  titleContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.display.bold,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.body.regular,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  methodsContainer: {
    gap: SPACING.md,
  },
  methodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  methodIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(143, 251, 185, 0.1)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  methodTitle: {
    fontSize: 16,
    fontFamily: FONTS.display.medium,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 13,
    fontFamily: FONTS.body.regular,
    color: COLORS.textSecondary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  socialBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONTS.body.medium,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: SPACING.xl,
  },
  footerText: {
    fontSize: 12,
    fontFamily: FONTS.body.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SignUpMethodScreen;
