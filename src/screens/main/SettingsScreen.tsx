import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { ChevronLeft, LogOut, Bell, Shield, HelpCircle, FileText, User } from 'lucide-react-native';
import { firebaseAuth } from '../../api/firebase';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const SettingsScreen = ({ navigation }: any) => {

    const handleLogout = async () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await firebaseAuth.signOut();
                            // Navigation will handle auth state change automatically
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = (icon: any, title: string, onPress?: () => void) => (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View style={styles.itemLeft}>
                {icon}
                <Text style={styles.itemTitle}>{title}</Text>
            </View>
            <ChevronLeft color={COLORS.textSecondary} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Account</Text>
                {renderItem(<User color={COLORS.white} size={20} />, 'Edit Profile', () => navigation.navigate('EditProfile'))}
                {renderItem(<Bell color={COLORS.white} size={20} />, 'Notifications', () => navigation.navigate('NotificationSettings'))}
                {renderItem(<Shield color={COLORS.white} size={20} />, 'Privacy & Security', () => navigation.navigate('PrivacySettings'))}

                <Text style={styles.sectionTitle}>Support</Text>
                {renderItem(<HelpCircle color={COLORS.white} size={20} />, 'Help Center', () => navigation.navigate('Support'))}
                {renderItem(<FileText color={COLORS.white} size={20} />, 'Terms of Service', () => navigation.navigate('Legal', { type: 'terms' }))}
                {renderItem(<FileText color={COLORS.white} size={20} />, 'Privacy Policy', () => navigation.navigate('Legal', { type: 'privacy' }))}

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut color={COLORS.error} size={20} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Version 1.0.0 (Build 24)</Text>
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
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.display.semiBold,
        color: COLORS.white,
    },
    content: {
        padding: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: FONTS.body.bold,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemTitle: {
        fontSize: 16,
        color: COLORS.white,
        fontFamily: FONTS.body.medium,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginTop: SPACING.xl,
        gap: 8,
    },
    logoutText: {
        color: COLORS.error,
        fontFamily: FONTS.display.semiBold,
        fontSize: 16,
    },
    version: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: SPACING.xl,
        fontFamily: FONTS.body.regular,
    },
});

export default SettingsScreen;
