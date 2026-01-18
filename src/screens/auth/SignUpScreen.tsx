import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { firebaseAuth } from '../../api/firebase';
import userService from '../../api/userService';
import authService from '../../api/authService';
import { COLORS, SPACING } from '../../constants/theme';
import { Mail, Lock, ChevronLeft, ArrowRight, Apple, Facebook, Phone } from 'lucide-react-native';
import { logEvent, EVENTS } from '../../utils/analytics';

// Custom Google Icon SVG since Lucide doesn't have it
const GoogleIcon = ({ size = 24 }: { size?: number }) => (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: size * 0.8 }}>G</Text>
    </View>
);

const SignUpScreen = ({ navigation, route }: any) => {
    const insets = useSafeAreaInsets();
    const { accountType = 'individual' } = route.params || {};
    const [mode, setMode] = useState<'signup' | 'login'>('signup');
    const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (authMethod === 'email' && (!email || !password)) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (authMethod === 'phone' && !phoneNumber) {
            Alert.alert('Error', 'Please enter your phone number');
            return;
        }

        setLoading(true);
        try {
            if (authMethod === 'email') {
                if (mode === 'signup') {
                    const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
                    await userService.createUserProfile(userCredential.user.uid, {
                        email,
                        accountType,
                    });
                    logEvent(EVENTS.SIGNUP_COMPLETED, { method: 'email', account_type: accountType });
                    navigation.navigate('OTPVerification', { uid: userCredential.user.uid, email, accountType });
                } else {
                    await firebaseAuth.signInWithEmailAndPassword(email, password);
                    logEvent(EVENTS.LOGIN, { method: 'email' });
                }
            } else {
                // Phone Auth
                const confirmation = await authService.signInWithPhoneNumber(phoneNumber);
                navigation.navigate('OTPVerification', {
                    uid: 'pending',
                    phoneNumber,
                    verificationMethod: 'phone',
                    confirmation,
                    accountType
                });
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Authentication Failed', error.message || 'Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
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
                logEvent(EVENTS.LOGIN, { method: provider });
                // Navigation will be handled by App.tsx listener
            }
        } catch (error: any) {
            console.error(`${provider} Login Error:`, error);
            if (error.code !== 'E_SIGN_IN_CANCELLED' && error.message !== 'User cancelled the login process') {
                Alert.alert('Login Failed', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</Text>
            </View>

            <View style={styles.brandContainer}>
                <Image
                    source={require('../../../assets/images/icon.png')}
                    style={styles.brandIcon}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.content}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'signup' && styles.activeTab]}
                        onPress={() => setMode('signup')}
                    >
                        <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>Sign Up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'login' && styles.activeTab]}
                        onPress={() => setMode('login')}
                    >
                        <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Log In</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <View style={styles.methodToggle}>
                        <TouchableOpacity
                            onPress={() => setAuthMethod('email')}
                            style={[styles.methodBtn, authMethod === 'email' && styles.methodBtnActive]}
                        >
                            <Mail size={16} color={authMethod === 'email' ? COLORS.background : COLORS.textSecondary} />
                            <Text style={[styles.methodText, authMethod === 'email' && styles.methodTextActive]}>Email</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setAuthMethod('phone')}
                            style={[styles.methodBtn, authMethod === 'phone' && styles.methodBtnActive]}
                        >
                            <Phone size={16} color={authMethod === 'phone' ? COLORS.background : COLORS.textSecondary} />
                            <Text style={[styles.methodText, authMethod === 'phone' && styles.methodTextActive]}>Mobile</Text>
                        </TouchableOpacity>
                    </View>

                    {authMethod === 'email' ? (
                        <>
                            <View style={styles.inputBox}>
                                <Mail color={COLORS.textSecondary} size={20} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputBox}>
                                <Lock color={COLORS.textSecondary} size={20} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </>
                    ) : (
                        <View style={styles.inputBox}>
                            <Phone color={COLORS.textSecondary} size={20} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mobile Number (+1...)"
                                placeholderTextColor={COLORS.textSecondary}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.background} />
                        ) : (
                            <>
                                <Text style={styles.primaryBtnText}>
                                    {mode === 'signup' ? 'Continue' : 'Log In'}
                                </Text>
                                <ArrowRight color={COLORS.background} size={20} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.divider}>
                    <View style={styles.line} />
                    <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                    <View style={styles.line} />
                </View>

                <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('google')}>
                        <GoogleIcon />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('facebook')}>
                        <Facebook color={COLORS.white} size={24} />
                    </TouchableOpacity>
                    {Platform.OS === 'ios' && (
                        <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('apple')}>
                            <Apple color={COLORS.white} size={24} />
                        </TouchableOpacity>
                    )}
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
        backgroundColor: COLORS.background,
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
        padding: SPACING.lg,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 4,
        marginBottom: SPACING.xl,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: COLORS.background,
    },
    form: {
        gap: SPACING.md,
    },
    methodToggle: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    methodBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
    },
    methodBtnActive: {
        backgroundColor: COLORS.primary,
    },
    methodText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    methodTextActive: {
        color: COLORS.background,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        flex: 1,
        color: COLORS.white,
        marginLeft: SPACING.sm,
        fontSize: 16,
    },
    primaryBtn: {
        flexDirection: 'row',
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.md,
        gap: 8,
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.background,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.xxl,
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
        gap: SPACING.xl,
    },
    socialBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    brandContainer: {
        alignItems: 'center',
        marginVertical: SPACING.md,
    },
    brandIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(143, 251, 185, 0.3)',
    }
});

export default SignUpScreen;
