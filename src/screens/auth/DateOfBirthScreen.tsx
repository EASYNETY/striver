import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, Calendar, ArrowRight } from 'lucide-react-native';
import userService from '../../api/userService';
import { logEvent, EVENTS } from '../../utils/analytics';

const DateOfBirthScreen = ({ navigation, route }: any) => {
    const { uid, accountType: initialAccountType } = route.params || {};
    const [accountType, setAccountType] = useState(initialAccountType);
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!accountType) {
            userService.getCurrentUserProfile().then(profile => {
                if (profile?.accountType) setAccountType(profile.accountType);
            });
        }
    }, []);

    const calculateAge = (birthDate: string) => {
        const parts = birthDate.split('/');
        if (parts.length !== 3) return -1;
        const birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const handleContinue = async () => {
        const age = calculateAge(dob);
        if (age === -1) {
            Alert.alert('Invalid Date', 'Please use DD/MM/YYYY format');
            return;
        }

        setLoading(true);
        try {
            await userService.updateUserProfile(uid, { dob });

            if (accountType === 'family') {
                if (age < 18) {
                    Alert.alert('Parent Required', 'A parent or guardian must be 18+ to manage a family account.');
                    return;
                }
                navigation.navigate('VerifyAge', { uid, accountType });
            } else {
                if (age < 13) {
                    Alert.alert(
                        'Junior Baller Detected',
                        'Users under 13 must use a Family Account managed by a parent. Would you like to switch?',
                        [
                            { text: 'Switch to Family', onPress: () => navigation.navigate('AccountType') },
                            { text: 'Cancel', style: 'cancel' }
                        ]
                    );
                    return;
                }

                // For individuals 13-17 or 18+
                if (age < 18) {
                    navigation.navigate('VerifyAge', { uid, accountType });
                } else {
                    navigation.navigate('InterestsSelection', { uid });
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save date of birth');
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
                <Text style={styles.headerTitle}>Birthday</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.iconBox}>
                    <Calendar color={COLORS.primary} size={48} />
                </View>

                <Text style={styles.title}>When's your birthday?</Text>
                <Text style={styles.subtitle}>
                    This helps us customize your experience and keep the community safe.
                </Text>

                <View style={styles.inputBox}>
                    <TextInput
                        style={styles.input}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor={COLORS.textSecondary}
                        value={dob}
                        onChangeText={(text) => {
                            // Remove all non-numeric characters
                            const cleaned = text.replace(/[^0-9]/g, '');

                            // Auto-format with slashes
                            let formatted = '';
                            if (cleaned.length > 0) {
                                formatted = cleaned.substring(0, 2);
                            }
                            if (cleaned.length >= 3) {
                                formatted += '/' + cleaned.substring(2, 4);
                            }
                            if (cleaned.length >= 5) {
                                formatted += '/' + cleaned.substring(4, 8);
                            }

                            setDob(formatted);
                        }}
                        keyboardType="number-pad"
                        maxLength={10}
                    />
                </View>

                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleContinue}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.background} />
                    ) : (
                        <>
                            <Text style={styles.primaryBtnText}>Continue</Text>
                            <ArrowRight color={COLORS.background} size={20} />
                        </>
                    )}
                </TouchableOpacity>
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
        marginBottom: SPACING.xxl,
    },
    inputBox: {
        width: '100%',
        height: 56,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
        justifyContent: 'center',
        marginBottom: SPACING.xxl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        color: COLORS.white,
        fontSize: 18,
        letterSpacing: 2,
        textAlign: 'center',
    },
    primaryBtn: {
        flexDirection: 'row',
        width: '100%',
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.background,
    },
});

export default DateOfBirthScreen;
