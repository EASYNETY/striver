import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Image } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, Plus, UserCircle2, Settings, ShieldCheck } from 'lucide-react-native';
import { modularDb } from '../../api/firebase';
import { collection, doc, onSnapshot, query } from '@react-native-firebase/firestore';
import userService from '../../api/userService';

const FamilySetupScreen = ({ navigation, route }: any) => {
    const { uid } = route.params || {};
    const [children, setChildren] = useState<any[]>([]);
    const [approvals, setApprovals] = useState<any[]>([]);

    useEffect(() => {
        if (!uid) return;

        // Sync with Firestore children subcollection using modular API
        const q = query(collection(doc(modularDb, 'users', uid), 'children'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot) {
                console.warn('Children snapshot is null');
                return;
            }
            const childList = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                // Basic age calculation from DD/MM/YYYY
                let age = '?';
                if (data.dob) {
                    try {
                        const parts = data.dob.split('/');
                        const dobDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                        const diff = Date.now() - dobDate.getTime();
                        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)).toString();
                    } catch (e) { }
                }
                return { id: docSnap.id, ...data, age };
            });
            setChildren(childList);
        }, error => {
            console.error("Error fetching children (FamilySetup):", error);
        });

        // Sync approvals
        const approvalsUnsubscribe = userService.getApprovalsListener(uid, (data) => {
            setApprovals(data);
        });

        return () => {
            unsubscribe();
            approvalsUnsubscribe();
        };
    }, [uid]);

    const addChild = () => {
        navigation.navigate('ChildProfile', { uid, mode: 'create' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Family Hub</Text>
                <TouchableOpacity
                    style={styles.settingsBtn}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Settings color={COLORS.white} size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.parentCard}>
                    <View style={styles.parentInfo}>
                        <View style={styles.avatarPlaceholder}>
                            <UserCircle2 color={COLORS.textSecondary} size={40} />
                        </View>
                        <View>
                            <Text style={styles.parentName}>Family Manager</Text>
                            <View style={styles.badge}>
                                <ShieldCheck color={COLORS.primary} size={12} />
                                <Text style={badgeTextStyles.text}>Verified Parent</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {approvals.length > 0 && (
                    <View style={{ marginBottom: SPACING.xl }}>
                        <Text style={styles.sectionTitle}>Pending Approvals</Text>
                        {approvals.map(approval => (
                            <View key={approval.id} style={styles.approvalCard}>
                                <View style={styles.approvalInfo}>
                                    <Text style={styles.approvalTitle}>{approval.title || 'Reward Request'}</Text>
                                    <View style={styles.approvalActions}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { borderColor: '#FF3B30' }]}
                                            onPress={() => userService.actionApproval(uid, approval.id, 'rejected')}
                                        >
                                            <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '700' }}>Reject</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                                            onPress={() => userService.actionApproval(uid, approval.id, 'approved')}
                                        >
                                            <Text style={{ color: COLORS.background, fontSize: 12, fontWeight: '700' }}>Approve</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={styles.sectionTitle}>Child Profiles</Text>

                {children.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No child profiles added yet.</Text>
                        <Text style={styles.emptySubtext}>You can add up to 5 children under 13.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={children}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.childCard} onPress={() => navigation.navigate('ChildProfile', { uid, childId: item.id, mode: 'edit' })}>
                                <View style={styles.childAvatar} />
                                <View style={styles.childInfo}>
                                    <Text style={styles.childName}>{item.displayName}</Text>
                                    <Text style={styles.childAge}>{item.age} years old</Text>
                                </View>
                                <ChevronLeft color={COLORS.textSecondary} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
                            </TouchableOpacity>
                        )}
                        keyExtractor={item => item.id}
                    />
                )}

                <TouchableOpacity style={styles.addBtn} onPress={addChild}>
                    <Plus color={COLORS.background} size={24} />
                    <Text style={styles.addBtnText}>Add Alpha Striker (Child)</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.finishBtn}
                    onPress={async () => {
                        if (uid) {
                            await userService.updateUserProfile(uid, { onboardingComplete: true });
                        }
                    }}
                >
                    <Text style={styles.finishBtnText}>Go to Dashboard</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const badgeTextStyles = StyleSheet.create({
    text: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    }
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.white,
    },
    settingsBtn: {
        padding: SPACING.sm,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    parentCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: SPACING.md,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    parentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    parentName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    childCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.sm,
    },
    childAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
    },
    childInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    childName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    childAge: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    emptyState: {
        padding: SPACING.xl,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: SPACING.xl,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.white,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 8,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 16,
        gap: SPACING.sm,
    },
    addBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.background,
    },
    footer: {
        padding: SPACING.lg,
    },
    finishBtn: {
        height: 56,
        backgroundColor: COLORS.surface,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    finishBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    approvalCard: {
        backgroundColor: 'rgba(143, 251, 185, 0.05)',
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.2)',
    },
    approvalInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    approvalTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.white,
        flex: 1,
    },
    approvalActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
});

export default FamilySetupScreen;
