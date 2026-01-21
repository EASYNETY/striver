import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, FileText, ShieldCheck } from 'lucide-react-native';

const LegalScreen = ({ navigation, route }: any) => {
    const { type } = route.params || { type: 'terms' };
    const isTerms = type === 'terms';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isTerms ? 'Terms of Service' : 'Privacy Policy'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconContainer}>
                    {isTerms ? <FileText color={COLORS.primary} size={48} /> : <ShieldCheck color={COLORS.primary} size={48} />}
                </View>

                <Text style={styles.title}>{isTerms ? 'Striver Terms of Service' : 'Privacy & Safety Policy'}</Text>
                <Text style={styles.date}>Last updated: January 2024</Text>

                <Text style={styles.paragraph}>
                    Welcome to Striver, the premier platform for young athletes. By using our services, you agree to the following terms and conditions designed to keep our community safe and inspiring.
                </Text>

                <Text style={styles.subTitle}>1. Community Standards</Text>
                <Text style={styles.paragraph}>
                    Striver is a place for positivity. Bullying, harassment, or inappropriate content will result in immediate account suspension. We use AI and human moderation to ensure a safe environment for all Junior Ballers.
                </Text>

                <Text style={styles.subTitle}>2. Safety & Moderation</Text>
                <Text style={styles.paragraph}>
                    All videos uploaded by users under 13 must be approved by a verified parent or guardian before appearing on the public feed. DMs are disabled for child accounts to prevent unsolicited contact.
                </Text>

                <Text style={styles.subTitle}>3. Data Privacy</Text>
                <Text style={styles.paragraph}>
                    We do not sell your personal data. We collect minimal information necessary to provide the service and track athletic progress. Parents have full control over their children's data and visibility.
                </Text>

                <Text style={styles.paragraph}>
                    For the full detailed legal document, please visit our official website at https://striver.app/legal.
                </Text>
            </ScrollView>
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
        gap: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
    },
    content: {
        padding: SPACING.lg,
    },
    iconContainer: {
        alignItems: 'center',
        marginVertical: SPACING.xl,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.white,
        textAlign: 'center',
    },
    date: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: SPACING.xl,
    },
    subTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
        marginTop: SPACING.lg,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 22,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: SPACING.md,
    }
});

export default LegalScreen;
