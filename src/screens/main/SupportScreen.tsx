import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, MessageCircle, Mail, Globe, BookOpen } from 'lucide-react-native';

const SupportScreen = ({ navigation }: any) => {

    const SupportItem = ({ icon: Icon, title, sub, onPress }: any) => (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View style={styles.iconBox}>
                <Icon color={COLORS.primary} size={24} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{title}</Text>
                <Text style={styles.itemSub}>{sub}</Text>
            </View>
            <ChevronLeft color={COLORS.textSecondary} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Center</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>How can we help?</Text>
                <Text style={styles.subtitle}>Our team is here to support your athletic journey on Striver.</Text>

                <View style={styles.section}>
                    <SupportItem
                        icon={BookOpen}
                        title="User Manuals"
                        sub="Learn how to use all Striver features."
                        onPress={() => { }}
                    />
                    <SupportItem
                        icon={MessageCircle}
                        title="Live Chat"
                        sub="Chat with our support team (Mon-Fri)."
                        onPress={() => { }}
                    />
                    <SupportItem
                        icon={Mail}
                        title="Email Support"
                        sub="Send us an email at help@striver.app"
                        onPress={() => Linking.openURL('mailto:help@striver.app')}
                    />
                    <SupportItem
                        icon={Globe}
                        title="Community Forum"
                        sub="Discuss with other parents and players."
                        onPress={() => { }}
                    />
                </View>

                <View style={styles.faqBox}>
                    <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
                    <TouchableOpacity style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>How do I create a child profile?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>How do I withdraw Striver Coins?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>What are Legend Badges?</Text>
                    </TouchableOpacity>
                </View>
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
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.white,
        marginTop: SPACING.md,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 8,
        marginBottom: SPACING.xl,
    },
    section: {
        gap: SPACING.md,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.white,
    },
    itemSub: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    faqBox: {
        marginTop: SPACING.xl,
    },
    faqTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    faqItem: {
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    faqQuestion: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
    }
});

export default SupportScreen;
