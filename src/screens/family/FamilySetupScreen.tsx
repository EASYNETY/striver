import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Image } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, Plus, UserCircle2, Settings, ShieldCheck } from 'lucide-react-native';
import { db } from '../../api/firebase';
import userService from '../../api/userService';

const FamilySetupScreen = ({ navigation, route }: any) => {
    const { uid } = route.params || {};
    const [children, setChildren] = useState<any[]>([]);

    useEffect(() => {
        if (!uid) return;

        // Sync with Firestore children subcollection
        const unsubscribe = db.collection('users')
            .doc(uid)
            .collection('children')
            .onSnapshot(snapshot => {
                const childList = snapshot.docs.map(doc => {
                    const data = doc.data();
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
                    return { id: doc.id, ...data, age };
                });
                setChildren(childList);
            }, error => {
                console.error("Error fetching children:", error);
            });

        return () => unsubscribe();
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
                                <Text style={styles.badgeText}>Verified Parent</Text>
                            </View>
                        </View>
                    </View>
                </View>

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
                            <TouchableOpacity style={styles.childCard}>
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
    badgeText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
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
});

export default FamilySetupScreen;
