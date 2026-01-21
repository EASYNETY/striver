import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, Check, X, ShieldCheck, Video, Users } from 'lucide-react-native';
import userService from '../../api/userService';
import { firebaseAuth } from '../../api/firebase';

const ApprovalQueueScreen = ({ navigation }: any) => {
    const [approvals, setApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return;

        // Use real-time listener for approvals
        const unsubscribe = userService.getApprovalsListener(currentUser.uid, (data) => {
            // Sort by createdAt timestamp (Firestore FieldValue)
            const sortedData = [...data].sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });
            setApprovals(sortedData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAction = async (id: string, action: 'approved' | 'rejected') => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
            try {
                await userService.actionApproval(currentUser.uid, id, action);
            } catch (error) {
                console.error("Action approval error:", error);
            }
        }
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                <View style={styles.info}>
                    <View style={styles.typeRow}>
                        {item.type === 'video' ? <Video color={COLORS.primary} size={14} /> : <Users color={COLORS.primary} size={14} />}
                        <Text style={styles.type}>{item.type.toUpperCase()}</Text>
                        <Text style={styles.childName}>by {item.childName}</Text>
                    </View>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.date}>{item.date || 'Pending'}</Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleAction(item.id, 'rejected')}
                >
                    <X color={COLORS.white} size={20} />
                    <Text style={styles.actionText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleAction(item.id, 'approved')}
                >
                    <Check color={COLORS.background} size={20} />
                    <Text style={[styles.actionText, { color: COLORS.background }]}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Approval Queue</Text>
                    <Text style={styles.headerSub}>{approvals.length} pending requests</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.emptyState}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
            ) : approvals.length === 0 ? (
                <View style={styles.emptyState}>
                    <ShieldCheck color={COLORS.textSecondary} size={64} opacity={0.3} />
                    <Text style={styles.emptyTitle}>All caught up!</Text>
                    <Text style={styles.emptySub}>No pending approvals for your family.</Text>
                </View>
            ) : (
                <FlatList
                    data={approvals}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
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
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.white,
    },
    headerSub: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    list: {
        padding: SPACING.lg,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardContent: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    typeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    type: {
        fontSize: 10,
        color: COLORS.primary,
        fontWeight: '800',
        letterSpacing: 1,
    },
    childName: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
    date: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        marginTop: SPACING.md,
        gap: SPACING.md,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    approveBtn: {
        backgroundColor: COLORS.primary,
    },
    rejectBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.white,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
        marginTop: SPACING.lg,
    },
    emptySub: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    }
});

export default ApprovalQueueScreen;
