import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, Lock, Eye, MessageSquare, Share2, ShieldCheck } from 'lucide-react-native';

const PrivacySettingsScreen = ({ navigation }: any) => {
    const [isPrivate, setIsPrivate] = useState(false);
    const [allowMessages, setAllowMessages] = useState(true);
    const [showActivity, setShowActivity] = useState(true);
    const [allowRemix, setAllowRemix] = useState(true);

    const SettingItem = ({ icon: Icon, title, sub, value, onToggle }: any) => (
        <View style={styles.item}>
            <View style={styles.itemLeft}>
                <View style={styles.iconBox}>
                    <Icon color={COLORS.primary} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{title}</Text>
                    <Text style={styles.itemSub}>{sub}</Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: COLORS.surface, true: COLORS.primary }}
                thumbColor={COLORS.white}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy & Safety</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBanner}>
                    <ShieldCheck color={COLORS.primary} size={24} />
                    <Text style={styles.infoText}>Your safety is our priority. Child accounts have strict privacy defaults that cannot be changed here.</Text>
                </View>

                <Text style={styles.sectionTitle}>Account Privacy</Text>
                <SettingItem
                    icon={Lock}
                    title="Private Account"
                    sub="Only people you approve can see your videos."
                    value={isPrivate}
                    onToggle={setIsPrivate}
                />

                <Text style={styles.sectionTitle}>Interactions</Text>
                <SettingItem
                    icon={MessageSquare}
                    title="Direct Messages"
                    sub="Control who can send you messages."
                    value={allowMessages}
                    onToggle={setAllowMessages}
                />
                <SettingItem
                    icon={Share2}
                    title="Allow Remixing"
                    sub="Let others use your video audio and clips."
                    value={allowRemix}
                    onToggle={setAllowRemix}
                />
                <SettingItem
                    icon={Eye}
                    title="Activity Status"
                    sub="Show when you are active on Striver."
                    value={showActivity}
                    onToggle={setShowActivity}
                />
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
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: 'rgba(143, 251, 185, 0.05)',
        padding: SPACING.md,
        borderRadius: 16,
        gap: 12,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.1)',
    },
    infoText: {
        flex: 1,
        color: COLORS.primary,
        fontSize: 13,
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        marginBottom: SPACING.md,
        marginTop: SPACING.lg,
        marginLeft: 4,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
    itemSub: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    }
});

export default PrivacySettingsScreen;
