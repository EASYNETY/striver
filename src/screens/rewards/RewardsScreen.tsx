import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList, Modal } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { Trophy, ChevronRight, Coins, Clock, CheckCircle2, X, Download } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import userService, { UserProfile } from '../../api/userService';
import rewardService, { DailyTask, UserTaskProgress, TierBenefit } from '../../api/rewardService';
import marketplaceService, { Product } from '../../api/marketplaceService';
import { firebaseAuth } from '../../api/firebase';
import { Alert, ActivityIndicator, Image } from 'react-native';

const TASKS = rewardService.getDailyTasks();

const RewardsScreen = () => {
    const isFocused = useIsFocused();
    const [activeTab, setActiveTab] = useState('Earn');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [taskProgress, setTaskProgress] = useState<UserTaskProgress[]>([]);
    const [showTierBenefits, setShowTierBenefits] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const [dailySpend, setDailySpend] = useState(0);

    const handleExport = async () => {
        if (!userProfile) return;

        if (userProfile.ageTier !== 'first_teamer') {
            Alert.alert('Restricted', 'Only First Teamers (18+) can export financial and transaction history.');
            return;
        }

        Alert.alert('Success', 'Transaction history has been exported to your email.');
    };

    const categories = ['All', 'Merch', 'Equipment', 'Digital', 'Experiences'];

    // Tier calculations
    const tierInfo = userProfile ? rewardService.getTierProgress(userProfile.coins) : null;
    const currentTierName = userProfile?.tier || 'Bronze';
    const nextTierName = tierInfo?.nextTier?.tier;
    const coinsNeeded = tierInfo?.nextTier ? tierInfo.nextTier.minCoins - (userProfile?.coins || 0) : 0;
    const progressPercent = tierInfo?.progress || 0;

    useEffect(() => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser && isFocused) {
            // Subscribe to profile updates
            const unsubscribe = userService.subscribeToUserProfile(currentUser.uid, (profile) => {
                setUserProfile(profile);
            });

            // Load task progress
            loadTaskProgress();

            return () => unsubscribe();
        }
    }, [isFocused]);

    const loadTaskProgress = async () => {
        const progress = await rewardService.getUserTaskProgress();
        setTaskProgress(progress);

        if (firebaseAuth.currentUser) {
            const spend = await rewardService.getDailySpend(firebaseAuth.currentUser.uid);
            setDailySpend(spend);
        }
    };

    const loadProducts = async () => {
        const productData = await marketplaceService.getProducts();
        setProducts(productData);
    };

    const loadHistory = async () => {
        const history = await rewardService.getCoinTransactions();
        setTransactions(history);
    };

    useEffect(() => {
        if (showHistory) {
            loadHistory();
        }
    }, [showHistory]);

    useEffect(() => {
        if (activeTab === 'Spend') {
            loadProducts();
        }
    }, [activeTab]);

    // Purchase Logic with Age Gating
    const handlePurchase = async (product: Product) => {
        if (!userProfile) return;

        // Age Gating Logic
        if (userProfile.ageTier === 'junior_baller') {
            // Ages 4-12: Digital items only, max 50 coins/day
            if (product.category !== 'Digital') {
                Alert.alert('Restricted', 'Junior Ballers can only purchase digital items. Physical rewards and premium squads are blocked for your safety.');
                return;
            }

            if (dailySpend + product.price > 50) {
                Alert.alert('Daily Limit Reached', `You have already spent ${dailySpend} coins today. Your daily limit is 50 coins.`);
                return;
            }
        } else if (userProfile.ageTier === 'academy_prospect') {
            // Ages 13-17: Physical items require approval
            if (product.category !== 'Digital') {
                Alert.alert('Approval Required', 'High-value and physical reward redemptions require parent approval.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Ask Parent',
                        onPress: async () => {
                            try {
                                await userService.requestApproval(userProfile.uid, 'purchase', {
                                    title: `Redeem ${product.name}`,
                                    productId: product.id,
                                    price: product.price,
                                    image: product.image
                                });
                                Alert.alert('Request Sent', 'Your parent has been notified. You will get the reward once they approve!');
                            } catch (e: any) {
                                Alert.alert('Error', e.message);
                            }
                        }
                    }
                ]);
                return;
            }
        }

        if ((userProfile?.coins || 0) < product.price) {
            Alert.alert('Insufficient Coins', `You need ${product.price - (userProfile?.coins || 0)} more coins for this item.`);
            return;
        }

        Alert.alert(
            'Confirm Purchase',
            `Spend ${product.price} coins on ${product.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Purchase',
                    onPress: async () => {
                        setPurchasingId(product.id);
                        try {
                            await marketplaceService.purchaseProduct(product.id);
                            // If Junior Baller, notify parent automatically
                            if (userProfile.ageTier === 'junior_baller') {
                                try {
                                    await userService.requestApproval(userProfile.uid, 'purchase', {
                                        title: `Spent coins on ${product.name}`,
                                        productId: product.id,
                                        price: product.price,
                                        autoApproved: true // Junior baller spend is auto-approved but notified
                                    });
                                } catch (e) {
                                    console.log('Notification failed but purchase succeeded');
                                }
                            }
                            Alert.alert('Success!', `You've purchased ${product.name}. Check your email/inventory for next steps.`);
                            loadTaskProgress(); // Refresh daily spend
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to complete purchase');
                        } finally {
                            setPurchasingId(null);
                        }
                    }
                }
            ]
        );
    };

    const filteredProducts = selectedCategory === 'All'
        ? products
        : products.filter(p => p.category === selectedCategory);

    const getTaskStatus = (taskId: string) => {
        const progress = taskProgress.find(p => p.taskId === taskId);
        return {
            completed: progress?.completed || false,
            current: progress?.currentCount || 0
        };
    };

    const renderTaskItem = (task: DailyTask) => {
        const status = getTaskStatus(task.id);
        const progressPercent = Math.min((status.current / task.targetCount) * 100, 100);

        return (
            <View key={task.id} style={styles.taskCard}>
                <View style={[styles.taskStatus, status.completed && { backgroundColor: COLORS.primary }]}>
                    {status.completed ? <CheckCircle2 color={COLORS.background} size={18} /> : <Trophy color={COLORS.textSecondary} size={18} />}
                </View>
                <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDesc}>{task.description}</Text>
                    <View style={styles.taskProgressContainer}>
                        <View style={styles.taskBar}>
                            <View style={[styles.taskFill, { width: `${progressPercent}%` }]} />
                        </View>
                        <Text style={styles.taskProgressText}>{status.current}/{task.targetCount}</Text>
                    </View>
                </View>
                <Text style={styles.taskReward}>+{task.reward}</Text>
            </View>
        );
    };

    const renderEarnTab = () => (
        <>
            <Text style={styles.sectionTitle}>Daily Activities</Text>
            {rewardService.getDailyTasks().map(renderTaskItem)}

            <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Milestones</Text>
            <Text style={styles.sectionSubtitle}>One-time achievements</Text>
            {rewardService.getMilestoneTasks().map(renderTaskItem)}
        </>
    );

    const renderSpendTab = () => (
        <View style={styles.marketplacePadding}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => setSelectedCategory(cat)}
                        style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
                    >
                        <Text style={[styles.categoryBtnText, selectedCategory === cat && styles.categoryBtnTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {products.length === 0 ? (
                <View style={styles.placeholderContainer}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
            ) : (
                <View style={styles.productGrid}>
                    {filteredProducts.map(product => (
                        <View key={product.id} style={styles.productCard}>
                            <Image source={{ uri: product.image }} style={styles.productImg} />
                            {product.isFeatured && (
                                <View style={styles.featuredBadge}>
                                    <Text style={styles.featuredText}>HOT</Text>
                                </View>
                            )}
                            <View style={styles.productBody}>
                                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                <View style={styles.priceRow}>
                                    <Coins color={COLORS.primary} size={14} />
                                    <Text style={styles.productPrice}>{product.price}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.buyBtn, (userProfile?.coins || 0) < product.price && styles.buyBtnDisabled]}
                                    onPress={() => handlePurchase(product)}
                                    disabled={purchasingId === product.id}
                                >
                                    {purchasingId === product.id ? (
                                        <ActivityIndicator size="small" color={COLORS.background} />
                                    ) : (
                                        <Text style={styles.buyBtnText}>REDEEM</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    const renderTiersTab = () => (
        <View>
            <Text style={styles.sectionTitle}>Tier Benefits</Text>
            {rewardService.getTierBenefits().map((tier, index) => {
                const isCurrent = currentTierName === tier.tier;
                const isUnlocked = (userProfile?.coins || 0) >= tier.minCoins;

                return (
                    <View key={index} style={[styles.benefitCard, isCurrent && styles.currentBenefitCard, { borderColor: isCurrent ? tier.color : 'rgba(255,255,255,0.05)' }]}>
                        <View style={styles.benefitHeader}>
                            <Text style={[styles.benefitTierName, { color: tier.color }]}>{tier.tier.toUpperCase()}</Text>
                            {isCurrent && <View style={[styles.currentBadge, { backgroundColor: tier.color }]}><Text style={[styles.currentBadgeText, { color: '#000' }]}>CURRENT</Text></View>}
                            {!isUnlocked && <View style={styles.lockedBadge}><Text style={styles.lockedBadgeText}>LOCKED</Text></View>}
                        </View>
                        <Text style={styles.benefitMinCoins}>{tier.minCoins.toLocaleString()} Coins Required</Text>
                        <View style={styles.benefitsList}>
                            {tier.benefits.map((benefit, i) => (
                                <View key={i} style={styles.benefitRow}>
                                    <CheckCircle2 color={isUnlocked ? tier.color : COLORS.textSecondary} size={14} />
                                    <Text style={[styles.benefitText, !isUnlocked && { color: COLORS.textSecondary }]}>{benefit}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                );
            })}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Rewards</Text>
                <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistory(true)}>
                    <Clock color={COLORS.white} size={22} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Tier Card */}
                <View style={styles.tierCard}>
                    <Text style={[styles.tierLabel, { color: tierInfo?.currentTier.color }]}>
                        {currentTierName.toUpperCase()} TIER
                    </Text>
                    <View style={styles.coinRow}>
                        <Coins color={COLORS.primary} size={32} />
                        <Text style={styles.coinCount}>{userProfile?.coins || 0}</Text>
                    </View>

                    {nextTierName ? (
                        <View style={styles.tierProgressContainer}>
                            <View style={styles.tierBar}>
                                <View style={[styles.tierFill, { width: `${progressPercent}%`, backgroundColor: tierInfo?.currentTier.color }]} />
                            </View>
                            <Text style={styles.tierProgressText}>{coinsNeeded} more to {nextTierName}</Text>
                        </View>
                    ) : (
                        <Text style={styles.tierProgressText}>Max Tier Reached! 🏆</Text>
                    )}
                </View>

                {/* Tab Navigation */}
                <View style={styles.tabs}>
                    {['Earn', 'Spend', 'Tiers'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {activeTab === 'Earn' && renderEarnTab()}
                {activeTab === 'Spend' && renderSpendTab()}
                {activeTab === 'Tiers' && renderTiersTab()}

                {activeTab === 'Earn' && (
                    <TouchableOpacity
                        style={styles.tierHistory}
                        onPress={() => setShowTierBenefits(true)}
                    >
                        <View style={styles.tierHistoryIcon}>
                            <Trophy color={COLORS.primary} size={20} />
                        </View>
                        <View style={styles.tierHistoryText}>
                            <Text style={styles.tierHistoryTitle}>View Tier Benefits</Text>
                            <Text style={styles.tierHistorySubtitle}>See what you unlock at each stage</Text>
                        </View>
                        <ChevronRight color={COLORS.textSecondary} size={20} />
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* History Modal */}
            <Modal
                visible={showHistory}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowHistory(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Coin History</Text>
                                <Text style={styles.modalSub}>Lifetime Activity</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity style={styles.iconBtn} onPress={handleExport}>
                                    <Download color={COLORS.primary} size={22} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowHistory(false)}>
                                    <X color={COLORS.white} size={24} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {transactions.length === 0 ? (
                                <View style={styles.emptyHistory}>
                                    <Clock color={COLORS.textSecondary} size={48} />
                                    <Text style={styles.emptyHistoryText}>No transactions yet</Text>
                                </View>
                            ) : (
                                transactions.map(item => (
                                    <View key={item.id} style={styles.historyItem}>
                                        <View style={styles.historyItemLeft}>
                                            <View style={[styles.historyIconBox, { backgroundColor: item.type === 'earn' ? 'rgba(143, 251, 185, 0.1)' : 'rgba(255, 65, 54, 0.1)' }]}>
                                                <Coins color={item.type === 'earn' ? COLORS.primary : '#FF4136'} size={18} />
                                            </View>
                                            <View>
                                                <Text style={styles.historyReason}>{item.reason}</Text>
                                                <Text style={styles.historyDate}>
                                                    {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.historyAmount, { color: item.type === 'earn' ? COLORS.primary : '#FF4136' }]}>
                                            {item.amount > 0 ? '+' : ''}{item.amount}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Benefits Modal */}
            <Modal
                visible={showTierBenefits}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowTierBenefits(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Tier Benefits</Text>
                            <TouchableOpacity onPress={() => setShowTierBenefits(false)}>
                                <X color={COLORS.white} size={24} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {renderTiersTab()}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    historyBtn: {
        padding: SPACING.sm,
    },
    content: {
        padding: SPACING.lg,
    },
    tierCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    tierLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.textSecondary,
        letterSpacing: 2,
        marginBottom: SPACING.md,
    },
    coinRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    coinCount: {
        fontSize: 48,
        fontWeight: '800',
        color: COLORS.white,
    },
    tierProgressContainer: {
        width: '100%',
        alignItems: 'center',
    },
    tierBar: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        marginBottom: 10,
    },
    tierFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    tierProgressText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    tabs: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
    },
    tabActive: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    tabTextActive: {
        color: COLORS.background,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.sm,
    },
    taskStatus: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    taskInfo: {
        flex: 1,
        marginLeft: SPACING.md,
        marginRight: SPACING.md,
    },
    taskTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.white,
    },
    taskDesc: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    taskProgressContainer: {
        marginTop: 8,
    },
    taskBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
    },
    taskFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    taskReward: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
    },
    tierHistory: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(143, 251, 185, 0.05)',
        padding: SPACING.md,
        borderRadius: 16,
        marginTop: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.1)',
    },
    tierHistoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tierHistoryText: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    tierHistoryTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.white,
    },
    tierHistorySubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        marginTop: SPACING.xl,
    },
    placeholderText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
        marginTop: SPACING.lg,
    },
    placeholderSubText: {
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
        lineHeight: 20,
    },
    benefitCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    currentBenefitCard: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(143, 251, 185, 0.05)',
    },
    benefitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    benefitTierName: {
        fontSize: 16,
        fontWeight: '800',
    },
    benefitMinCoins: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    currentBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    currentBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.background,
    },
    lockedBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    lockedBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    benefitsList: {
        gap: 8,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    benefitText: {
        fontSize: 14,
        color: COLORS.white,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '80%',
        padding: SPACING.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.xl,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.white,
    },
    // Marketplace Styles
    marketplacePadding: {
        paddingTop: SPACING.md,
    },
    categoryScroll: {
        marginBottom: SPACING.lg,
    },
    categoryBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    categoryBtnActive: {
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        borderColor: COLORS.primary,
    },
    categoryBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    categoryBtnTextActive: {
        color: COLORS.primary,
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    productCard: {
        width: '48%',
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 8,
    },
    productImg: {
        width: '100%',
        height: 120,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    featuredBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FF4136',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    featuredText: {
        color: COLORS.white,
        fontSize: 8,
        fontWeight: '900',
    },
    productBody: {
        padding: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
    },
    buyBtn: {
        backgroundColor: COLORS.primary,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buyBtnDisabled: {
        opacity: 0.5,
    },
    buyBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.background,
    },
    // History Styles
    emptyHistory: {
        alignItems: 'center',
        padding: SPACING.xxl,
    },
    emptyHistoryText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: SPACING.md,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    historyItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    historyIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyReason: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    historyDate: {
        color: COLORS.textSecondary,
        fontSize: 11,
        marginTop: 2,
    },
    historyAmount: {
        fontSize: 15,
        fontWeight: '800',
    },
    taskProgressText: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: '600',
        marginLeft: 8,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
});

export default RewardsScreen;
