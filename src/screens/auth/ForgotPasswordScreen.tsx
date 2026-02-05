import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import emailService from '../../api/emailService';
import { COLORS, SPACING } from '../../constants/theme';
import { Mail, ChevronLeft, ArrowRight } from 'lucide-react-native';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const ForgotPasswordScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const handleSendOTP = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Store OTP in Firestore for verification
            await db.collection('passwordResets').doc(email.toLowerCase()).set({
                otp,
                email: email.toLowerCase(),
                expiresAt,
                createdAt: new Date(),
                verified: false,
                attempts: 0
            });

            // Send OTP via custom service
            await emailService.sendOTP(email, otp, 'email');

            Alert.alert(
                'Code Sent!',
                'Check your email - we just sent you a 6-digit code!',
                [
                    {
                        text: 'Continue',
                        onPress: () => navigation.navigate('OTPVerification', {
                            email: email.toLowerCase(),
                            verificationMethod: 'email',
                            context: 'passwordReset'
                        })
                    }
                ]
            );
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Failed to send verification code. Please try again.');
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
                <Text style={styles.headerTitle}>Reset Password</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                    Enter your email address and we'll send you a link to reset your password.
                </Text>

                <View style={styles.form}>
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

                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleSendOTP}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.background} />
                        ) : (
                            <>
                                <Text style={styles.primaryBtnText}>Send reset link</Text>
                                <ArrowRight color={COLORS.background} size={20} />
                            </>
                        )}
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
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    backBtn: {
        padding: 5,
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
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: SPACING.sm,
        marginTop: SPACING.xl,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
        marginBottom: SPACING.xxl,
    },
    form: {
        gap: SPACING.md,
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
});

export default ForgotPasswordScreen;
