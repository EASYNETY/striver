import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { Users, User, ArrowRight } from 'lucide-react-native';
import { logEvent, EVENTS } from '../../utils/analytics';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const AccountTypeScreen = ({ navigation }: any) => {
    const handleSelection = (type: 'family' | 'individual') => {
        logEvent(EVENTS.ACCOUNT_TYPE_SELECTED, { type });
        // Navigate to signup method selection with account type
        navigation.navigate('SignUpMethod', { accountType: type });
    };

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            <View style={styles.content}>
                <Text style={styles.title}>Choose your experience</Text>
                <Text style={styles.subtitle}>Select the account type that's right for you</Text>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={styles.optionBtn}
                        onPress={() => handleSelection('family')}
                    >
                        <View style={styles.iconBox}>
                            <Users color={COLORS.primary} size={32} />
                        </View>
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>Family Account</Text>
                            <Text style={styles.optionDesc}>For parents with children under 13. Manage up to 5 child profiles.</Text>
                        </View>
                        <ArrowRight color={COLORS.textSecondary} size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionBtn}
                        onPress={() => handleSelection('individual')}
                    >
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 132, 255, 0.1)' }]}>
                            <User color={COLORS.blue} size={32} />
                        </View>
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>Individual Account</Text>
                            <Text style={styles.optionDesc}>For users 13 and older. Full access to the Striver experience.</Text>
                        </View>
                        <ArrowRight color={COLORS.textSecondary} size={20} />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Age verification will be required to ensure community safety.
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
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.white,
        marginTop: SPACING.xl,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: SPACING.sm,
        marginBottom: SPACING.xl,
        textAlign: 'center',
    },
    optionsContainer: {
        gap: SPACING.md,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconBox: {
        width: 60,
        height: 60,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionTextContainer: {
        flex: 1,
        marginLeft: SPACING.md,
        marginRight: SPACING.sm,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: 4,
    },
    optionDesc: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: SPACING.lg,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default AccountTypeScreen;
