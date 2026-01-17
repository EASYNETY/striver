import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, Camera, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { db } from '../../api/firebase';
import userService from '../../api/userService';
import { logEvent, EVENTS } from '../../utils/analytics';

const VerifyAgeScreen = ({ navigation, route }: any) => {
    const { uid, accountType: initialAccountType } = route.params || {};
    const [accountType, setAccountType] = useState(initialAccountType);
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        if (!accountType) {
            userService.getCurrentUserProfile().then(profile => {
                if (profile?.accountType) {
                    setAccountType(profile.accountType);
                }
            });
        }
    }, []);
    const [steps, setSteps] = useState([
        { id: 1, label: 'Email Verified', status: 'completed' },
        { id: 2, label: 'Identity/Age Check', status: 'pending' },
        { id: 3, label: 'Account Activation', status: 'pending' },
    ]);

    const startVerification = () => {
        setVerifying(true);
        // Mocking facial recognition verification
        setTimeout(() => {
            setVerifying(false);
            setVerified(true);
            setSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: 'completed' } : s));
            logEvent(EVENTS.MODERATION_APPROVED, { type: 'age_verification' });
        }, 3000);
    };

    const handleContinue = () => {
        if (accountType === 'family') {
            navigation.navigate('FamilySetup', { uid });
        } else {
            // Should not typically reach here as individuals go to InterestsSelection,
            // but in case they do, we send them to personalization.
            navigation.navigate('InterestsSelection');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Age Verification</Text>
            </View>

            <View style={styles.content}>
                {!verified ? (
                    <View style={styles.scanContainer}>
                        <View style={styles.faceFrame}>
                            {verifying ? (
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            ) : (
                                <Camera color={COLORS.textSecondary} size={48} />
                            )}
                        </View>
                        <Text style={styles.instructionTitle}>Position your face</Text>
                        <Text style={styles.instructionDesc}>
                            We use secure facial analysis to verify your age and keep the community safe.
                            Only real humans are allowed on Striver.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.successContainer}>
                        <View style={styles.successIconBox}>
                            <ShieldCheck color={COLORS.primary} size={64} />
                        </View>
                        <Text style={styles.instructionTitle}>Verification Successful!</Text>
                        <Text style={styles.instructionDesc}>
                            You have been verified. Welcome to the Striver squad.
                        </Text>
                    </View>
                )}

                <View style={styles.stepsContainer}>
                    {steps.map(step => (
                        <View key={step.id} style={styles.stepItem}>
                            <View style={[
                                styles.stepDot,
                                step.status === 'completed' && { backgroundColor: COLORS.primary }
                            ]}>
                                {step.status === 'completed' && <CheckCircle2 color={COLORS.background} size={14} />}
                            </View>
                            <Text style={[
                                styles.stepLabel,
                                step.status === 'completed' && { color: COLORS.white }
                            ]}>{step.label}</Text>
                        </View>
                    ))}
                </View>

                {!verified ? (
                    <TouchableOpacity
                        style={[styles.primaryBtn, verifying && { opacity: 0.7 }]}
                        onPress={startVerification}
                        disabled={verifying}
                    >
                        <Text style={styles.primaryBtnText}>
                            {verifying ? 'Verifying...' : 'Start Scan'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleContinue}
                    >
                        <Text style={styles.primaryBtnText}>Continue</Text>
                    </TouchableOpacity>
                )}
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
        padding: SPACING.lg,
        justifyContent: 'space-between',
    },
    scanContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    faceFrame: {
        width: 200,
        height: 260,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
    },
    successContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    successIconBox: {
        width: 120,
        height: 120,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
    },
    instructionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.white,
        textAlign: 'center',
    },
    instructionDesc: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 20,
    },
    stepsContainer: {
        gap: SPACING.sm,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: 12,
    },
    stepDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    primaryBtn: {
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.background,
    },
});

export default VerifyAgeScreen;
