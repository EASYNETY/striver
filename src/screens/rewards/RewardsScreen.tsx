import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image, SafeAreaView } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { CAREER_TIERS, BADGE_TIERS } from '../../constants/rewards';
import { RewardService } from '../../api/rewardService';
import userService from '../../api/userService';
import { firebaseAuth } from '../../api/firebase';
import { useIsFocused } from '@react-navigation/native';
import { Coins, Lock, History, Star, Info, Crown, Loader } from 'lucide-react-native';

interface RewardsScreenProps {
    user: any;
    navigation: any;
}

const RewardsScreen: React.FC<RewardsScreenProps> = ({ user: initialUser, navigation }) => {
    const isFocused = useIsFocused();
    const [activeTab, setActiveTab] = useState<'earn' | 'spend' | 'tiers'>('earn');
    const [profile, setProfile] = useState<any>(initialUser || null);
    const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loading, setLoading] = useState(!initialUser);
    const [dailyProgress, setDailyProgress] = useState({ watch_count: 0, claimedActions: [] as string[] });

    useEffect(() => {
        let unsubscribe: () => void;
        const currentUid = firebaseAuth.currentUser?.uid;

        if (isFocused && currentUid) {
            setLoading(true);
            unsubscribe = userService.onProfileChange(currentUid, (data) => {
                setProfile(data);
                setLoading(false);
            });
        }
        return () => unsubscribe?.();
    }, [isFocused]);

    useEffect(() => {
        if (profile?.uid) {
            loadHistory();
            loadDailyProgress();
        }
    }, [profile?.uid, isFocused]);

    const loadDailyProgress = async () => {
        if (!profile?.uid) return;
        try {
            const progress = await RewardService.getDailyProgress(profile.uid);
            setDailyProgress(progress);
        } catch (error) {
            console.error('Error loading daily progress:', error);
        }
    };

    const user = profile; // Use the locally managed profile

    // --- Data for UI ---
    const currentCoins = user?.coins ?? 0;
    const currentTierId = user?.career_tier_id || 'future_star';
    const currentTier = CAREER_TIERS.find(t => t.id === currentTierId) || CAREER_TIERS[0];
    const nextTier = CAREER_TIERS[CAREER_TIERS.findIndex(t => t.id === currentTierId) + 1];

    // Calculate progress based on total earnings
    const totalEarnings = user?.career_earnings || 0;
    const progress = nextTier
        ? (totalEarnings / nextTier.threshold)
        : 1;

    const loadHistory = async () => {
        if (user?.uid) {
            try {
                const history = await RewardService.getTransactionHistory(user.uid);
                setTransactionHistory(history);
            } catch (error) {
                console.error('Error loading history:', error);
            }
        }
    };

    const handleTaskComplete = (actionType: string) => {
        if (!user?.uid) return;
        RewardService.awardCoins(user.uid, actionType)
            .then(() => Alert.alert('Success', 'Coins earned!'))
            .catch(err => console.error(err));
    };

    // --- Render Sections ---
    if (loading && !user) {
        return (
            <SafeAreaView style={[styles.container, styles.centerEmpty]}>
                <Loader color={COLORS.primary} size={40} />
                <Text style={styles.subEmpty}>Loading rewards...</Text>
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={[styles.container, styles.centerEmpty]}>
                <Info color={COLORS.textSecondary} size={40} />
                <Text style={styles.emptyText}>Sign In Required</Text>
                <Text style={styles.subEmpty}>Please sign in to see your rewards.</Text>
            </SafeAreaView>
        );
    }

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>Rewards</Text>
                <View style={styles.coinBadge}>
                    <Coins color="#FFD700" size={20} fill="#FFD700" />
                    <Text style={styles.coinText}>{currentCoins}</Text>
                </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
                <View style={[styles.tierBadge, { backgroundColor: currentTier.color }]}>
                    <Text style={styles.tierText}>{currentTier.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowHistory(true)} style={{ marginTop: 8 }}>
                    <History color={COLORS.textSecondary} size={24} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
                <Text style={styles.progressText}>Current: {user?.career_earnings || 750}</Text>
                {nextTier && <Text style={styles.progressText}>Next: {nextTier.name} ({nextTier.threshold})</Text>}
            </View>
            <View style={styles.track}>
                <View style={[styles.bar, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: currentTier.color }]} />
            </View>
            <Text style={styles.motivationText}>
                {nextTier
                    ? `${nextTier.threshold - (user?.career_earnings || 750)} coins to reach ${nextTier.name}!`
                    : "You are the GOAT! 🐐"}
            </Text>
        </View>
    );

    const renderEarnTab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Daily Activities</Text>
            {/* Real Progress Tasks */}
            {[
                {
                    id: '1',
                    title: 'Daily Login',
                    amount: 5,
                    icon: '📅',
                    complete: dailyProgress.claimedActions.includes('daily_login'),
                    action: 'daily_login'
                },
                {
                    id: '2',
                    title: 'Watch 5 Videos',
                    amount: 10,
                    icon: '📺',
                    complete: dailyProgress.claimedActions.includes('watch_5_videos'),
                    action: 'watch_5_videos',
                    progress: dailyProgress.watch_count,
                    target: 5
                },
                {
                    id: '3',
                    title: 'Post a Response',
                    amount: 15,
                    icon: '💬',
                    complete: dailyProgress.claimedActions.includes('post_response'),
                    action: 'post_response'
                },
            ].map(task => (
                <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskLeft}>
                        <Text style={{ fontSize: 24 }}>{task.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.taskTitle}>{task.title}</Text>
                            <Text style={styles.taskReward}>+{task.amount} Coins</Text>
                            {task.target && !task.complete && (
                                <View style={styles.taskProgressBox}>
                                    <View style={styles.taskTrack}>
                                        <View style={[styles.taskBar, { width: `${(task.progress! / task.target) * 100}%` }]} />
                                    </View>
                                    <Text style={styles.taskProgressText}>{task.progress}/{task.target}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.claimBtn, task.complete && styles.claimedBtn]}
                        onPress={() => {
                            if (task.complete) return;
                            if (task.action === 'watch_5_videos') {
                                navigation.navigate('HomeFeed');
                            } else if (task.action === 'post_response') {
                                navigation.navigate('Upload');
                            } else if (task.action) {
                                handleTaskComplete(task.action);
                            }
                        }}
                    >
                        <Text style={styles.claimText}>{task.complete ? 'Done' : 'Do it'}</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <Text style={styles.sectionTitle}>Weekly Challenges</Text>
            <View style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                    <Crown color="#FFD700" size={24} />
                    <Text style={styles.challengeTitle}>Legend Challenge</Text>
                </View>
                <Text style={styles.challengeDesc}>Recreate Messi's dribble skill this week!</Text>
                <View style={styles.challengeReward}>
                    <Text style={styles.rewardText}>+50 Coins</Text>
                    <TouchableOpacity style={styles.joinBtn} onPress={() => navigation.navigate('SquadsTab')}>
                        <Text style={styles.joinText}>Join Challenge</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    const renderTiersTab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionExplain}>
                Earn career coins to climb the ranks from Future Star to GOAT. Your badge shows your status to the world!
            </Text>

            {CAREER_TIERS.map((tier, index) => {
                const isUnlocked = (user?.career_earnings || 750) >= tier.threshold;
                const isCurrent = currentTierId === tier.id;

                return (
                    <View key={tier.id} style={[styles.tierRow, isCurrent && styles.activeTierRow]}>
                        <View style={styles.tierInfo}>
                            <View style={[styles.tierIcon, { backgroundColor: tier.color }]}>
                                {index >= 8 && <Star color="black" size={12} fill="black" />}
                            </View>
                            <View>
                                <View>
                                    <Text style={[styles.tierName, isCurrent && { fontWeight: 'bold' }]}>{tier.name}</Text>
                                    <Text style={styles.tierThreshold}>{tier.threshold.toLocaleString()} Coins</Text>

                                    {/* Benefits Comparison Chart Snippet */}
                                    <View style={styles.benefitsList}>
                                        {tier.benefits.map((benefit, bIdx) => (
                                            <View key={bIdx} style={styles.benefitItem}>
                                                <View style={[styles.benefitDot, { backgroundColor: tier.color }]} />
                                                <Text style={styles.benefitText}>{benefit}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                        {isUnlocked ? (
                            isCurrent ? <Text style={styles.currentTag}>Current</Text> : <Text style={styles.unlockedTag}>Unlocked</Text>
                        ) : (
                            <Lock color={COLORS.textSecondary} size={16} />
                        )}
                    </View>
                );
            })}
        </ScrollView>
    );

    // --- Render Main ---
    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            {renderProgressBar()}

            <View style={styles.tabs}>
                {['earn', 'spend', 'tiers'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab as any)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ flex: 1 }}>
                {activeTab === 'earn' && renderEarnTab()}
                {/* Spend Tab implementation can go here or be valid mock */}
                {activeTab === 'spend' && (
                    <View style={styles.centerEmpty}>
                        <Text style={styles.emptyText}>Marketplace Coming Soon!</Text>
                        <Text style={styles.subEmpty}>Spend your coins on frames, card packs, and more.</Text>
                    </View>
                )}
                {activeTab === 'tiers' && renderTiersTab()}
            </View>

            {/* History Modal */}
            <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>History</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {transactionHistory.map(t => {
                            const isTierUp = t.actionType === 'tier_up';
                            return (
                                <View key={t.id} style={[styles.historyRow, isTierUp && styles.tierUpRow]}>
                                    <View style={styles.historyLeft}>
                                        <Text style={styles.historyType}>{isTierUp ? 'MILESTONE' : (t.type === 'earn' ? 'EARNED' : 'SPENT')}</Text>
                                        <Text style={[styles.historyAction, isTierUp && styles.tierUpText]}>
                                            {isTierUp ? `Reached Tier: ${t.metadata?.tierName}` : (t.actionType || t.itemName)}
                                        </Text>
                                        <Text style={styles.historyDate}>
                                            {t.timestamp?.toDate ? t.timestamp.toDate().toLocaleDateString() : 'Just now'}
                                        </Text>
                                    </View>
                                    {!isTierUp && (
                                        <Text style={[styles.historyAmount, { color: t.type === 'earn' ? COLORS.success : COLORS.error }]}>
                                            {t.type === 'earn' ? '+' : '-'}{t.amount}
                                        </Text>
                                    )}
                                    {isTierUp && <Star color="#FFD700" size={20} fill="#FFD700" />}
                                </View>
                            );
                        })}
                        {transactionHistory.length === 0 && <Text>No history yet.</Text>}
                    </ScrollView>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.white },
    coinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
    coinText: { color: 'white', fontWeight: 'bold', marginLeft: 6, fontSize: 16 },
    tierBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    tierText: { fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },

    progressContainer: { paddingHorizontal: SPACING.md, marginBottom: SPACING.lg },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressText: { color: COLORS.textSecondary, fontSize: 12 },
    track: { height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden' },
    bar: { height: '100%' },
    motivationText: { color: COLORS.primary, fontSize: 12, marginTop: 6, textAlign: 'center', fontWeight: '600' },

    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333' },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabText: { color: COLORS.textSecondary, fontWeight: '600' },
    activeTabText: { color: COLORS.white },

    scrollContent: { padding: SPACING.md },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 16, marginTop: 10 },
    taskCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginBottom: 12, elevation: 4 },
    taskLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1, marginRight: 10 },
    taskTitle: { color: 'white', fontWeight: '700', fontSize: 16 },
    taskReward: { color: '#FFD700', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
    taskProgressBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    taskTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
    taskBar: { height: '100%', backgroundColor: COLORS.primary },
    taskProgressText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold' },
    claimBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, minWidth: 80, alignItems: 'center' },
    claimedBtn: { backgroundColor: '#333' },
    claimText: { color: COLORS.background, fontWeight: 'bold', fontSize: 12 },

    challengeCard: { backgroundColor: '#2A1A40', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#C7A8FF' },
    challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    challengeTitle: { color: '#C7A8FF', fontSize: 18, fontWeight: '800' },
    challengeDesc: { color: 'white', marginBottom: 16 },
    challengeReward: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rewardText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
    joinBtn: { backgroundColor: '#C7A8FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    joinText: { color: '#2A1A40', fontWeight: 'bold' },

    sectionExplain: { color: COLORS.textSecondary, marginBottom: 20, textAlign: 'center' },
    tierRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    activeTierRow: { backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: -16, paddingHorizontal: 16 },
    tierInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    tierIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    tierName: { color: 'white', fontSize: 16 },
    tierThreshold: { color: COLORS.textSecondary, fontSize: 12 },
    benefitsList: { marginTop: 8, gap: 4 },
    benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    benefitDot: { width: 4, height: 4, borderRadius: 2 },
    benefitText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
    currentTag: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
    unlockedTag: { color: COLORS.success, fontSize: 12 },

    centerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    subEmpty: { color: COLORS.textSecondary, marginTop: 8 },

    modalContainer: { flex: 1, backgroundColor: COLORS.background },
    modalHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#333' },
    modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    closeText: { color: COLORS.primary, fontSize: 16 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    historyLeft: { gap: 2 },
    historyType: { color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold' },
    historyAction: { color: 'white', fontSize: 14 },
    historyDate: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
    historyAmount: { fontWeight: 'bold', fontSize: 16 },
    tierUpRow: { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: '#FFD700', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
    tierUpText: { color: '#FFD700', fontWeight: 'bold' }
});

export default RewardsScreen;
