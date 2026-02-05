import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { COLORS, SPACING } from '../../constants/theme';
import { Lock, ChevronLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const ResetPasswordScreen = ({ navigation, route }: any) => {
    const insets = useSafeAreaInsets();
    const { email, otp } = route.params || {};
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            // Call the Cloud Function
            const updatePasswordFunction = db.app.functions().httpsCallable('updatePasswordWithOTP');
            const result = await updatePasswordFunction({
                email,
                otp,
                newPassword: password
            });

            if (result.data.success) {
                Alert.alert(
                    'All Set!',
                    'Password updated! You\'re good to go - log in with your new password.',
                    [{ text: 'Log In', onPress: () => navigation.navigate('SignUp', { mode: 'login' }) }]
                );
            }
        } catch (error: any) {
            console.error('Reset Error:', error);
            Alert.alert('Error', error.message || 'Failed to reset password. Please try again.');
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
                <Text style={styles.headerTitle}>New Password</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Secure your account</Text>
                <Text style={styles.subtitle}>
                    Create a new, strong password for <Text style={{ fontWeight: '700', color: COLORS.white }}>{email}</Text>
                </Text>

                <View style={styles.form}>
                    <View style={styles.inputBox}>
                        <Lock color={COLORS.textSecondary} size={20} />
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            placeholderTextColor={COLORS.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff color={COLORS.textSecondary} size={20} /> : <Eye color={COLORS.textSecondary} size={20} />}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputBox}>
                        <Lock color={COLORS.textSecondary} size={20} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            placeholderTextColor={COLORS.textSecondary}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                        />
                    </View>

                    <View style={styles.requirementsContainer}>
                        <View style={styles.requirementItem}>
                            <CheckCircle2 size={14} color={password.length >= 8 ? COLORS.primary : COLORS.textSecondary} />
                            <Text style={[styles.requirementText, password.length >= 8 ? styles.requirementMet : undefined]}>
                                Minimum 8 characters
                            </Text>
                        </View>
                        <View style={styles.requirementItem}>
                            <CheckCircle2 size={14} color={(password && password === confirmPassword) ? COLORS.primary : COLORS.textSecondary} />
                            <Text style={[styles.requirementText, (password && password === confirmPassword) ? styles.requirementMet : undefined]}>
                                Passwords match
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryBtn, (password.length < 8 || password !== confirmPassword) && styles.disabledBtn]}
                        onPress={handleReset}
                        disabled={loading || password.length < 8 || password !== confirmPassword}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.background} />
                        ) : (
                            <Text style={styles.primaryBtnText}>Reset Password</Text>
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
    requirementsContainer: {
        marginTop: SPACING.sm,
        gap: 8,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    requirementText: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    requirementMet: {
        color: COLORS.primary,
    },
    primaryBtn: {
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xl,
    },
    disabledBtn: {
        backgroundColor: 'rgba(143, 251, 185, 0.3)',
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.background,
    },
});

export default ResetPasswordScreen;
