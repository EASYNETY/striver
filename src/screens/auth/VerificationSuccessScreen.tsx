import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { CheckCircle2, ArrowRight } from 'lucide-react-native';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VerificationSuccessScreen = ({ navigation, route }: any) => {
    const insets = useSafeAreaInsets();
    const { uid } = route.params || {};

    const handleContinue = () => {
        navigation.navigate('InterestsSelection', { uid });
    };

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            <View style={styles.content}>
                <View style={styles.iconBox}>
                    <CheckCircle2 color={COLORS.primary} size={80} />
                </View>

                <Text style={styles.title}>You're All Set!</Text>
                <Text style={styles.subtitle}>
                    Your identity has been successfully verified.
                    Welcome to the Striver official squad!
                </Text>

                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleContinue}
                >
                    <Text style={styles.primaryBtnText}>Continue to Interests</Text>
                    <ArrowRight color={COLORS.background} size={20} />
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
    content: {
        flex: 1,
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBox: {
        width: 140,
        height: 140,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xxl,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xxl * 1.5,
    },
    primaryBtn: {
        width: '100%',
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        flexDirection: 'row',
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

export default VerificationSuccessScreen;
