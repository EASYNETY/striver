import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Switch, Dimensions, Alert } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ShieldCheck, Users, Clock, Moon, Lock, ChevronRight, Bell, Video, UserPlus, Settings } from 'lucide-react-native';
import userService, { ChildProfile } from '../../api/userService';
import { firebaseAuth, db } from '../../api/firebase';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ParentDashboardScreen = () => {
    const navigation = useNavigation<any>();
    const [children, setChildren] = useState<ChildProfile[]>([]);
    const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Verification Status State
    const [verificationStatus, setVerificationStatus] = useState<string>('idle');
    const [verificationLoading, setVerificationLoading] = useState(true);

    // Toggles state
    const [screenTimeEnabled, setScreenTimeEnabled] = useState(true);
    const [bedtimeModeEnabled, setBedtimeModeEnabled] = useState(true);
    const [settingsLockEnabled, setSettingsLockEnabled] = useState(false);

    useEffect(() => {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return;

        // Listener for parent profile (verification status)
        const unsubscribeProfile = db.collection('users').doc(currentUser.uid).onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                setVerificationStatus(data?.ageVerificationStatus || 'idle');
            }
            setVerificationLoading(false);
        });

        // Listener for children
        const unsubscribeChildren = userService.getChildrenListener(currentUser.uid, (childData: ChildProfile[]) => {
            setChildren(childData);
            setLoading(false);
        });

        // Listener for pending approvals count
        const unsubscribeApprovals = userService.getApprovalsListener(currentUser.uid, (approvals) => {
            setPendingApprovalsCount(approvals.length);
        });

        return () => {
            unsubscribeProfile();
            unsubscribeChildren();
            unsubscribeApprovals();
        };
    }, []);

    const handleSimulateRequest = async () => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser && children.length > 0) {
            await userService.createMockApprovalRequest(currentUser.uid, children[0].displayName);
            Alert.alert("Demo Mode", "A mock approval request has been sent from " + children[0].displayName);
        } else {
            Alert.alert("Error", "Create a child profile first to simulate requests.");
        }
    };

    const handleSwitchToChild = async (childId: string) => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
            await userService.switchActiveProfile(currentUser.uid, childId);
        }
    };

    const renderVerificationStatus = () => {
        if (verificationLoading) return null;

        if (verificationStatus === 'verified') {
            return (
                <View style={styles.verificationBanner}>
                    <ShieldCheck color={COLORS.primary} size={20} />
                    <Text style={styles.verificationText}>Verified Parent Account</Text>
                </View>
            );
        } else if (verificationStatus === 'pending') {
            return (
                <View style={[styles.verificationBanner, { backgroundColor: 'rgba(255, 179, 71, 0.1)', borderColor: 'rgba(255, 179, 71, 0.3)' }]}>
                    <Clock color="#FFB347" size={20} />
                    <Text style={[styles.verificationText, { color: '#FFB347' }]}>Verification Pending</Text>
                </View>
            );
        } else if (verificationStatus === 'failed' || verificationStatus === 'rejected') {
            return (
                <TouchableOpacity
                    style={[styles.verificationBanner, { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: 'rgba(255, 59, 48, 0.3)' }]}
                    onPress={() => navigation.navigate('OndatoVerification')}
                >
                    <Users color="#FF3B30" size={20} />
                    <Text style={[styles.verificationText, { color: '#FF3B30' }]}>Verification Failed - Tap to Retry</Text>
                </TouchableOpacity>
            );
        }

        // Default / Idle
        return (
            <TouchableOpacity
                style={[styles.verificationBanner, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}
                onPress={() => navigation.navigate('OndatoVerification')}
            >
                <ShieldCheck color={COLORS.textSecondary} size={20} />
                <Text style={[styles.verificationText, { color: COLORS.textSecondary }]}>Verify Identity to Unlock All Features</Text>
                <ChevronRight color={COLORS.textSecondary} size={16} />
            </TouchableOpacity>
        );
    };

    const ControlCard = ({ icon: Icon, title, value, onToggle }: any) => (
        <View style={styles.controlCard}>
            <View style={styles.controlHeader}>
                <View style={styles.iconCircle}>
                    <Icon color={COLORS.primary} size={20} />
                </View>
                <Text style={styles.controlTitle}>{title}</Text>
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: COLORS.surface, true: COLORS.primary }}
                    thumbColor={COLORS.white}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Family Hub</Text>
                        <Text style={styles.subGreeting}>Managing {children.length} profiles</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.bellBtn, { backgroundColor: COLORS.primary }]}
                            onPress={handleSimulateRequest}
                        >
                            <Video color={COLORS.background} size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('ApprovalQueue')}>
                            <Bell color={COLORS.white} size={24} />
                            {pendingApprovalsCount > 0 && <View style={styles.notificationDot} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Verification Status Banner */}
                {renderVerificationStatus()}

                {/* Profile Switcher */}
                <Text style={styles.sectionTitle}>Switch to Child View</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileSwitcher}>
                    {children.map((child) => (
                        <TouchableOpacity
                            key={child.id}
                            style={styles.profileItem}
                            onPress={() => handleSwitchToChild(child.id)}
                        >
                            <View style={styles.avatarPill}>
                                <Image
                                    source={{ uri: child.avatar || `https://ui-avatars.com/api/?name=${child.displayName}&background=8FFBB9&color=053E2B` }}
                                    style={styles.childAvatar}
                                />
                                <View style={styles.activeDot} />
                            </View>
                            <Text style={styles.childName}>{child.displayName}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={styles.profileItem}
                        onPress={() => navigation.navigate('ChildProfile', { uid: firebaseAuth.currentUser?.uid })}
                    >
                        <View style={[styles.avatarPill, styles.addPill]}>
                            <UserPlus color={COLORS.textSecondary} size={24} />
                        </View>
                        <Text style={styles.childName}>Add New</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Quick Actions */}
                <View style={styles.statsGrid}>
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => navigation.navigate('ApprovalQueue')}
                    >
                        <Video color={COLORS.primary} size={24} />
                        <Text style={styles.statValue}>{pendingApprovalsCount}</Text>
                        <Text style={styles.statLabel}>Pending Uploads</Text>
                    </TouchableOpacity>
                    <View style={[styles.statCard, { backgroundColor: 'rgba(143, 251, 185, 0.05)' }]}>
                        <Users color={COLORS.primary} size={24} />
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>Total Squad Members</Text>
                    </View>
                </View>

                {/* Supervision Controls */}
                <Text style={styles.sectionTitle}>Digital Wellness</Text>
                <ControlCard
                    icon={Clock}
                    title="Screen Time Limit (1h)"
                    value={screenTimeEnabled}
                    onToggle={setScreenTimeEnabled}
                />
                <ControlCard
                    icon={Moon}
                    title="Bedtime Mode"
                    value={bedtimeModeEnabled}
                    onToggle={setBedtimeModeEnabled}
                />
                <ControlCard
                    icon={Lock}
                    title="Settings Lock"
                    value={settingsLockEnabled}
                    onToggle={setSettingsLockEnabled}
                />

                {/* Approval Queue */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('ApprovalQueue')}
                >
                    <View style={styles.menuIconBox}>
                        <ShieldCheck color={COLORS.white} size={20} />
                    </View>
                    <View style={styles.menuContent}>
                        <Text style={styles.menuTitle}>Approval Queue</Text>
                        <Text style={styles.menuSub}>Review new squad requests and videos</Text>
                    </View>
                    <ChevronRight color={COLORS.textSecondary} size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <View style={[styles.menuIconBox, { backgroundColor: COLORS.surface }]}>
                        <Settings color={COLORS.white} size={20} />
                    </View>
                    <View style={styles.menuContent}>
                        <Text style={styles.menuTitle}>Family Settings</Text>
                        <Text style={styles.menuSub}>Manage subscriptions and data</Text>
                    </View>
                    <ChevronRight color={COLORS.textSecondary} size={20} />
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        marginTop: SPACING.md,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.white,
    },
    subGreeting: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    bellBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.surface,
    },
    verificationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        marginHorizontal: SPACING.lg,
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.2)',
    },
    verificationText: {
        flex: 1,
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.xl,
        marginBottom: SPACING.md,
    },
    profileSwitcher: {
        paddingLeft: SPACING.lg,
    },
    profileItem: {
        alignItems: 'center',
        marginRight: SPACING.lg,
    },
    avatarPill: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: COLORS.primary,
        padding: 3,
        marginBottom: 8,
    },
    childAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    activeDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.primary,
        borderWidth: 3,
        borderColor: COLORS.background,
    },
    addPill: {
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    childName: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: SPACING.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.white,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 2,
        textAlign: 'center',
    },
    controlCard: {
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        padding: SPACING.md,
        borderRadius: 16,
    },
    controlHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlTitle: {
        flex: 1,
        color: COLORS.white,
        fontWeight: '600',
        marginLeft: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        padding: SPACING.md,
        borderRadius: 16,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuContent: {
        flex: 1,
        marginLeft: 16,
    },
    menuTitle: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    menuSub: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
});

export default ParentDashboardScreen;
