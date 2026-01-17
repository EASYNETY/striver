import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, ShieldCheck, Mail, Phone } from 'lucide-react-native';
import userService from '../../api/userService';

const OTPVerificationScreen = ({ navigation, route }: any) => {
    const { uid, email, phoneNumber, verificationMethod = 'email', accountType: initialAccountType } = route.params || {};
    const [accountType, setAccountType] = useState(initialAccountType);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [loading, setLoading] = useState(false);
    const inputs = useRef<any[]>([]);

    useEffect(() => {
        if (!accountType) {
            userService.getUserProfile(uid).then(profile => {
                if (profile?.accountType) setAccountType(profile.accountType);
            });
        }
    }, []);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleCodeChange = (text: string, index: number) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        // Auto-focus next input
        if (text && index < 5) {
            inputs.current[index + 1].focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    const handleVerify = async () => {
        const fullCode = code.join('');
        if (fullCode.length < 6) {
            Alert.alert('Error', 'Please enter the 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const { confirmation } = route.params || {};

            if (confirmation) {
                // Real Phone Auth Verification
                const userCredential = await confirmation.confirm(fullCode);
                if (userCredential.user) {
                    const profile = await userService.getUserProfile(userCredential.user.uid);
                    if (!profile) {
                        await userService.createUserProfile(userCredential.user.uid, {
                            phoneNumber: userCredential.user.phoneNumber || '',
                            accountType,
                        });
                    }
                    navigation.navigate('DateOfBirth', { uid: userCredential.user.uid, accountType });
                    return;
                }
            }

            // Mock verification (123456 always works)
            if (fullCode === '123456') {
                navigation.navigate('DateOfBirth', { uid, accountType });
                return;
            }

            Alert.alert('Verification Failed', 'Invalid code. Try using 123456 for testing.');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        if (timer > 0) return;
        setTimer(60);
        Alert.alert('Code Sent', 'Use 123456 for testing.');
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

                <Text style={styles.title}>Enter Code</Text>
                <Text style={styles.subtitle}>
                    We've sent a 6-digit code to {verificationMethod === 'email' ? email : phoneNumber}
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

                <View style={styles.footer}>
                    <Text style={styles.resendText}>Didn't receive code? </Text>
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
