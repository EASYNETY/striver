import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, Bell, MessageCircle, Heart, UserPlus, Play } from 'lucide-react-native';

const NotificationSettingsScreen = ({ navigation }: any) => {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [likesEnabled, setLikesEnabled] = useState(true);
    const [commentsEnabled, setCommentsEnabled] = useState(true);
    const [mentionsEnabled, setMentionsEnabled] = useState(false);
    const [squadEnabled, setSquadEnabled] = useState(true);

    const SettingItem = ({ icon: Icon, title, value, onToggle }: any) => (
        <View style={styles.item}>
            <View style={styles.itemLeft}>
                <View style={styles.iconBox}>
                    <Icon color={COLORS.primary} size={20} />
                </View>
                <Text style={styles.itemTitle}>{title}</Text>
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
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.masterItem}>
                    <View>
                        <Text style={styles.masterTitle}>Push Notifications</Text>
                        <Text style={styles.masterSub}>Receive alerts on this device</Text>
                    </View>
                    <Switch
                        value={pushEnabled}
                        onValueChange={setPushEnabled}
                        trackColor={{ false: COLORS.surface, true: COLORS.primary }}
                        thumbColor={COLORS.white}
                    />
                </View>

                {pushEnabled && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Activity</Text>
                        <SettingItem
                            icon={Heart}
                            title="Likes"
                            value={likesEnabled}
                            onToggle={setLikesEnabled}
                        />
                        <SettingItem
                            icon={MessageCircle}
                            title="Comments"
                            value={commentsEnabled}
                            onToggle={setCommentsEnabled}
                        />
                        <SettingItem
                            icon={UserPlus}
                            title="New Followers"
                            value={mentionsEnabled}
                            onToggle={setMentionsEnabled}
                        />
                        <SettingItem
                            icon={Play}
                            title="Squad Updates"
                            value={squadEnabled}
                            onToggle={setSquadEnabled}
                        />
                    </View>
                )}
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
    masterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: 20,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    masterTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.white,
    },
    masterSub: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    section: {
        gap: SPACING.md,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        marginBottom: SPACING.sm,
        marginLeft: 4,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    }
});

export default NotificationSettingsScreen;
