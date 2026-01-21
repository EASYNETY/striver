import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, ActivityIndicator, AppState } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, ShieldCheck, Mail, Phone, CheckCircle } from 'lucide-react-native';
import userService from '../../api/userService';
import { firebaseAuth } from '../../api/firebase';

const OTPVerificationScreen = ({ navigation, route }: any) => {
    const { uid, email, phoneNumber, verificationMethod = 'email', accountType: initialAccountType, confirmation } = route.params || {};
    const [accountType, setAccountType] = useState(initialAccountType);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [loading, setLoading] = useState(false);
    const inputs = useRef<any[]>([]);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        if (!accountType) {
            userService.getUserProfile(uid).then(profile => {
                if (profile?.accountType) setAccountType(profile.accountType);
            });
        }
    }, []);

    // Timer logic
    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Auto-check email verification when app comes to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                if (verificationMethod === 'email') {
                    checkEmailVerification();
                }
            }
            appState.current = nextAppState;
        });
        return () => subscription.remove();
    }, [verificationMethod]);

    const checkEmailVerification = async () => {
        if (verificationMethod !== 'email') return;

        try {
            await firebaseAuth.currentUser?.reload();
            if (firebaseAuth.currentUser?.emailVerified) {
                // Success
                Alert.alert('Success', 'Email verified successfully!');
                navigation.replace('DateOfBirth', { uid: firebaseAuth.currentUser.uid, accountType });
            }
        } catch (error) {
            console.log('Verification check failed', error);
        }
    };

    const handleCodeChange = (text: string, index: number) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        // Auto-focus next input
        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        try {
            if (verificationMethod === 'email') {
                await checkEmailVerification();
                // If not verified yet:
                await firebaseAuth.currentUser?.reload();
                if (!firebaseAuth.currentUser?.emailVerified) {
                    Alert.alert('Not Verified', 'We haven\'t received the verification yet. Please check your email and click the link.');
                }
            } else {
                // PHONE AUTH
                const fullCode = code.join('');
                if (fullCode.length < 6) {
                    Alert.alert('Error', 'Please enter the 6-digit code');
                    return;
                }

                if (confirmation) {
                    // Real Phone Auth Verification
                    const userCredential = await confirmation.confirm(fullCode);
                    if (userCredential.user) {
                        const profile = await userService.getUserProfile(userCredential.user.uid);
                        if (!profile) {
                            await userService.createUserProfile(userCredential.user.uid, {
                                phoneNumber: userCredential.user.phoneNumber || '',
                                accountType: accountType || 'individual',
                            });
                        }
                        navigation.navigate('DateOfBirth', { uid: userCredential.user.uid, accountType });
                    }
                } else {
                    // Mock/Dev fallback (if confirmation prop is missing)
                    if (fullCode === '123456') {
                        navigation.navigate('DateOfBirth', { uid, accountType });
                    } else {
                        Alert.alert('Error', 'Invalid code or missing confirmation object.');
                    }
                }
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Verification Failed', error.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        setLoading(true);
        try {
            if (verificationMethod === 'email') {
                await firebaseAuth.currentUser?.sendEmailVerification();
                Alert.alert('Sent', `Verification link sent to ${email}`);
            } else {
                // Phone resend logic would require passing the phoneNumber and recalling signInWithPhoneNumber
                // For now we just reset timer or show alert
                Alert.alert('Info', 'To resend SMS, please go back and request again.');
            }
            setTimer(60);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verification</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.iconBox}>
                    {verificationMethod === 'email' ? (
                        <Mail color={COLORS.primary} size={48} />
                    ) : (
                        <Phone color={COLORS.primary} size={48} />
                    )}
                </View>

                {verificationMethod === 'email' ? (
                    <>
                        <Text style={styles.title}>Check your Email</Text>
                        <Text style={styles.subtitle}>
                            We've sent a verification link to {email}.{'\n'}
                            Please click the link to verify your account.
                        </Text>

                        <View style={{ height: 20 }} />

                        <TouchableOpacity
                            style={styles.verifyBtn}
                            onPress={handleVerify}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.verifyBtnText}>I've Verified</Text>}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.title}>Enter Code</Text>
                        <Text style={styles.subtitle}>
                            We've sent a 6-digit code to {phoneNumber}
                        </Text>

                        <View style={styles.codeContainer}>
                            {code.map((digit, i) => (
                                <TextInput
                                    key={i}
                                    ref={ref => inputs.current[i] = ref}
                                    style={styles.codeInput}
                                    maxLength={1}
                                    keyboardType="number-pad"
                                    value={digit}
                                    onChangeText={text => handleCodeChange(text, i)}
                                    onKeyPress={e => handleKeyPress(e, i)}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.verifyBtn}
                            onPress={handleVerify}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.verifyBtnText}>Verify</Text>}
                        </TouchableOpacity>
                    </>
                )}

                <View style={styles.footer}>
                    <Text style={styles.resendText}>
                        {verificationMethod === 'email' ? "Didn't receive the link? " : "Didn't receive code? "}
                    </Text>
                    <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                        <Text style={[styles.resendLink, timer > 0 && { opacity: 0.5 }]}>
                            {timer > 0 ? `Resend in ${timer}s` : 'Resend Now'}
                        </Text>
                    </TouchableOpacity>
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
        padding: SPACING.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
        marginLeft: SPACING.sm,
    },
    content: {
        flex: 1,
        padding: SPACING.xl,
        alignItems: 'center',
    },
    iconBox: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xxl,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.xxl,
    },
    codeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: SPACING.xxl,
    },
    codeInput: {
        width: 45,
        height: 55,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        color: COLORS.white,
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    verifyBtn: {
        width: '100%',
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.background,
    },
    footer: {
        flexDirection: 'row',
        marginTop: SPACING.xl,
    },
    resendText: {
        color: COLORS.textSecondary,
    },
    resendLink: {
        color: COLORS.primary,
        fontWeight: '700',
    }
});

export default OTPVerificationScreen;
