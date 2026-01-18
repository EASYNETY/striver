import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Image, Platform, PermissionsAndroid } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, Camera, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { db } from '../../api/firebase';
import userService from '../../api/userService';
import { logEvent, EVENTS } from '../../utils/analytics';

import { launchCamera } from 'react-native-image-picker';

const VerifyAgeScreen = ({ navigation, route }: any) => {
    const { uid, accountType: initialAccountType } = route.params || {};
    const [accountType, setAccountType] = useState(initialAccountType);
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);

    const [userAge, setUserAge] = useState<number | null>(null);
    const [ageError, setAgeError] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(null);

    useEffect(() => {
        userService.getCurrentUserProfile().then(profile => {
            if (profile?.accountType) setAccountType(profile.accountType);
            if (profile?.dob) {
                const parts = profile.dob.split('/');
                if (parts.length === 3) {
                    const birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    const today = new Date();
                    let age = today.getFullYear() - birth.getFullYear();
                    const m = today.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                    setUserAge(age);

                    // Requirement: Teenagers or children can NOT be verified
                    if (age < 18) {
                        setAgeError(true);
                    }
                }
            }
        });
    }, []);

    const [steps, setSteps] = useState([
        { id: 1, label: 'Email Verified', status: 'completed' },
        { id: 2, label: 'Identity Check (18+ Only)', status: 'pending' },
        { id: 3, label: 'Account Activation', status: 'pending' },
    ]);

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "Striver Camera Permission",
                        message: "Striver needs access to your camera for identity verification.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const startVerification = async () => {
        if (ageError) {
            Alert.alert(
                "Verification Restricted",
                "Full Identity Verification is only available for users 18 and older. Younger users are protected by our baseline safety standards instead."
            );
            return;
        }

        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert("Permission Denied", "Camera permission is required for verification.");
            return;
        }

        // Use Image Picker to take a selfie
        try {
            const result = await launchCamera({
                mediaType: 'photo',
                cameraType: 'front',
                quality: 0.8,
                saveToPhotos: false
            });

            if (result.didCancel) return;
            if (result.errorCode) {
                Alert.alert("Camera Error", result.errorMessage || "An unknown error occurred.");
                return;
            }

            if (result.assets && result.assets[0].uri) {
                setPhotoUri(result.assets[0].uri);
                setVerifying(true);
                // Simulate AI analysis
                setTimeout(() => {
                    setVerifying(false);
                    setVerified(true);
                    setSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: 'completed' } : s));
                    logEvent(EVENTS.MODERATION_APPROVED, { type: 'age_verification' });
                }, 3000);
            }
        } catch (error) {
            console.error("Camera Launch Error:", error);
            Alert.alert("Error", "Could not open camera.");
        }
    };

    const handleContinue = () => {
        if (ageError) {
            // If they are under 18, they just skip verification but can still use the app (with restrictions)
            navigation.navigate('InterestsSelection');
            return;
        }

        if (accountType === 'family') {
            navigation.navigate('FamilySetup', { uid });
        } else {
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

            <View style={styles.brandContainer}>
                <Image
                    source={require('../../../assets/images/icon.png')}
                    style={styles.brandIcon}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.content}>
                {!verified ? (
                    <View style={styles.scanContainer}>
                        <View style={styles.faceFrame}>
                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={[styles.faceFrame, { marginBottom: 0 }]} />
                            ) : verifying ? (
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            ) : (
                                <Camera color={COLORS.textSecondary} size={48} />
                            )}
                        </View>
                        {ageError ? (
                            <>
                                <Text style={[styles.instructionTitle, { color: COLORS.error || '#FF3B30' }]}>Verification Restricted</Text>
                                <Text style={styles.instructionDesc}>
                                    Striver Identity Verification is strictly for users 18+.
                                    Younger users are protected by our automated safety guardrails.
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.instructionTitle}>Position your face</Text>
                                <Text style={styles.instructionDesc}>
                                    We use secure facial analysis to verify your age and keep the community safe.
                                    Only real humans are allowed on Striver.
                                </Text>
                            </>
                        )}
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
                        style={[
                            styles.primaryBtn,
                            (verifying || ageError) && { opacity: 0.7, backgroundColor: ageError ? COLORS.surface : COLORS.primary }
                        ]}
                        onPress={startVerification}
                        disabled={verifying || ageError}
                    >
                        <Text style={[styles.primaryBtnText, ageError && { color: COLORS.textSecondary }]}>
                            {verifying ? 'Verifying...' : ageError ? 'Verification Locked' : 'Start Scan'}
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
        color: COLORS.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
    brandContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    brandIcon: {
        width: 80,
        height: 80,
    }
});

export default VerifyAgeScreen;
