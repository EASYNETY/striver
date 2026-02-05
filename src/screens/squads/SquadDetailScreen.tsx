import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert, Modal, ActivityIndicator, FlatList, TextInput, Share } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { ChevronLeft, MessageSquare, Trophy, Users, Plus, Share2, Settings, Lock, Check, X, ShieldCheck, Download, LogOut, Camera } from 'lucide-react-native';
import squadService, { Squad } from '../../api/squadService';
import postService, { Post } from '../../api/postService';
import { firebaseAuth } from '../../api/firebase';
import paymentService from '../../api/paymentService';
import rewardService from '../../api/rewardService';
import userService, { UserProfile } from '../../api/userService';
import { shareContent } from '../../utils/deepLink';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const SquadDetailScreen = ({ navigation, route }: any) => {
    const { squadId } = route.params;
    const [squad, setSquad] = useState<Squad | null>(null);
    const [isMember, setIsMember] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'leaderboard' | 'challenges'>('feed');
    const [showPaywall, setShowPaywall] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showCreateChallenge, setShowCreateChallenge] = useState(false);

    // Form states for Challenge
    const [challengeTitle, setChallengeTitle] = useState('');
    const [challengeDesc, setChallengeDesc] = useState('');
    const [challengeReward, setChallengeReward] = useState('');

    // Form Stats for Admin
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editRules, setEditRules] = useState('');
    const [editPrice, setEditPrice] = useState('');

    useEffect(() => {
        loadUserProfile();
        const unsubscribe = squadService.subscribeToSquad(squadId, (updatedSquad) => {
            if (updatedSquad) {
                setSquad(updatedSquad);
                setEditName(updatedSquad.name);
                setEditDesc(updatedSquad.description);
                setEditRules(updatedSquad.rules || '');
                setEditPrice(updatedSquad.price || '');
                checkPermissions(updatedSquad);
            }
        });
        loadPosts();
        loadMembers();
        loadChallenges();
        loadLeaderboard();
        return () => unsubscribe();
    }, [squadId]);

    const loadUserProfile = async () => {
        const profile = await userService.getCurrentUserProfile();
        setUserProfile(profile);
    };

    const loadPosts = async () => {
        try {
            const fetchedPosts = await postService.getSquadPosts(squadId);
            setPosts(fetchedPosts);
        } catch (error) {
            console.error('Failed to load squad posts:', error);
        }
    };

    const loadMembers = async () => {
        const squadMembers = await squadService.getSquadMembers(squadId);
        setMembers(squadMembers);
    };

    const loadChallenges = async () => {
        try {
            const squadChallenges = await squadService.getSquadChallenges(squadId);
            setChallenges(squadChallenges);
        } catch (error) {
            console.error('Failed to load challenges:', error);
        }
    };

    const loadLeaderboard = async () => {
        try {
            const squadLeaderboard = await squadService.getSquadLeaderboard(squadId);
            setLeaderboard(squadLeaderboard);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
    };

    const checkPermissions = async (currentSquad: Squad) => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
            const memberStatus = await squadService.isMember(squadId, currentUser.uid);
            setIsMember(memberStatus);
            setIsAdmin(currentSquad.creatorId === currentUser.uid);
        }
    };

    const processJoin = async () => {
        try {
            if (squad?.kudosCost) {
                await rewardService.deductCoins(firebaseAuth.currentUser!.uid, squad.kudosCost, `Joined ${squad.name}`);
            }
            await squadService.joinSquad(squadId);
            await rewardService.updateTaskProgress('join_squad', 1);
            Alert.alert('Welcome!', 'You are now a member.');
        } catch (error) {
            Alert.alert('Error', 'Failed to join.');
        }
    };

    const handleJoin = async () => {
        if (!userProfile || !squad) return;

        // Check age restriction eligibility
        const eligibility = await squadService.canJoinSquad(squadId, userProfile.uid);
        if (!eligibility.canJoin) {
            Alert.alert('Cannot Join', eligibility.reason || 'You cannot join this squad');
            return;
        }

        // AGE TIER RESTRICTIONS
        if (userProfile.ageTier === 'junior_baller') {
            Alert.alert('Restricted', 'Junior Ballers need a parent to help them join squads.');
            return;
        }

        // Standard Join Flow
        if (squad?.kudosCost && (userProfile?.coins || 0) < squad.kudosCost) {
            Alert.alert('Insufficient Kudos', `You need ${squad.kudosCost} Kudos to join.`);
            return;
        }

        if (squad?.kudosCost) {
            Alert.alert('Join with Kudos', `Spend ${squad.kudosCost} Kudos?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Join', onPress: processJoin }
            ]);
            return;
        }

        processJoin();
    };

    const handlePremiumPurchase = async () => {
        setProcessingPayment(true);
        try {
            const priceVal = squad?.price ? parseFloat(squad.price.replace(/[^0-9.]/g, '')) * 100 : 499;
            await paymentService.initializePaymentSheet(priceVal, 'gbp', `Subscription to ${squad?.name}`);
            const success = await paymentService.openPaymentSheet();
            if (success) {
                setShowPaywall(false);
                processJoin();
            }
        } catch (error: any) {
            if (error.code !== 'Canceled') Alert.alert('Payment Failed', error.message);
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleShare = async () => {
        await shareContent(
            `Join ${squad?.name}`,
            `Check out this squad on Striver! Invite Code: ${squad?.inviteCode}`,
            'squad',
            squadId
        );
    };

    const handleUpdateSquad = async () => {
        try {
            await squadService.updateSquad(squadId, {
                name: editName,
                description: editDesc,
                rules: editRules,
                price: editPrice
            });
            setShowAdminModal(false);
            Alert.alert('Success', 'Squad updated.');
        } catch (error) {
            Alert.alert('Error', 'Update failed.');
        }
    };

    const renderHeader = () => (
        <View>
            <View style={styles.bannerContainer}>
                <Image source={{ uri: squad?.image || 'https://via.placeholder.com/800x400' }} style={styles.banner} />
                <View style={styles.overlay} />
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.white} size={24} />
                </TouchableOpacity>
                {isAdmin && (
                    <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowAdminModal(true)}>
                        <Settings color={COLORS.white} size={24} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.squadName}>{squad?.name}</Text>
                    {squad?.isPremium && (
                        <View style={styles.premiumBadge}>
                            <Lock size={12} color={COLORS.background} />
                            <Text style={styles.premiumText}>PREMIUM</Text>
                        </View>
                    )}
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Users size={16} color={COLORS.textSecondary} />
                        <Text style={styles.statText}>{squad?.memberCount} Members</Text>
                    </View>
                    <View style={styles.stat}>
                        <Lock size={16} color={COLORS.textSecondary} />
                        <Text style={styles.statText}>{squad?.isPrivate ? 'Private' : 'Public'}</Text>
                    </View>
                </View>

                <Text style={styles.description}>{squad?.description}</Text>

                {squad?.tags && (
                    <View style={styles.tagRow}>
                        {squad.tags.map((tag, i) => (
                            <View key={i} style={styles.tag}>
                                <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {!isMember ? (
                    <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
                        <Text style={styles.joinBtnText}>
                            {squad?.kudosCost ? `Join (${squad.kudosCost} Kudos)` : 'Join Squad'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionBtn, { flex: 2 }]} onPress={() => navigation.navigate('MainTabs', { screen: 'Upload', params: { squadId } })}>
                            <Plus size={20} color={COLORS.background} />
                            <Text style={styles.actionBtnText}>Post to Squad</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleShare}>
                            <Share2 size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.tabBar}>
                    {['feed', 'challenges', 'members', 'leaderboard'].map((tab) => (
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
            </View>
        </View>
    );

    const renderFeed = () => (
        posts.length > 0 ? (
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.postCard}>
                        <View style={styles.postHeader}>
                            <Image source={{ uri: item.userAvatar || 'https://via.placeholder.com/100' }} style={styles.postAvatar} />
                            <Text style={styles.postUsername}>{item.username}</Text>
                        </View>
                        <Text style={styles.postCaption}>{item.caption}</Text>
                        <View style={styles.postFooter}>
                            <MessageSquare size={16} color={COLORS.textSecondary} />
                            <Text style={styles.postFooterText}>{item.comments}</Text>
                            <Trophy size={16} color={COLORS.textSecondary} style={{ marginLeft: 16 }} />
                            <Text style={styles.postFooterText}>{item.likes}</Text>
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
            />
        ) : (
            <ScrollView>
                {renderHeader()}
                <View style={styles.emptyState}>
                    <MessageSquare size={48} color={COLORS.surface} />
                    <Text style={styles.emptyText}>No posts yet. Be the first!</Text>
                </View>
            </ScrollView>
        )
    );

    const renderMembers = () => (
        <ScrollView>
            {renderHeader()}
            <View style={styles.memberList}>
                {members.map((member, i) => (
                    <View key={i} style={styles.memberRow}>
                        <View style={styles.memberAvatar}>
                            <Text style={styles.avatarText}>{member.username?.[0]?.toUpperCase() || 'U'}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                            <Text style={styles.memberName}>{member.username || 'Striver Member'}</Text>
                            <Text style={styles.memberRole}>{member.role || 'Member'}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderChallenges = () => (
        <ScrollView>
            {renderHeader()}
            <View style={styles.challengeSection}>
                {isAdmin && (
                    <TouchableOpacity style={styles.addChallengeBtn} onPress={() => setShowCreateChallenge(true)}>
                        <Plus size={20} color={COLORS.primary} />
                        <Text style={styles.addChallengeText}>Create Squad Challenge</Text>
                    </TouchableOpacity>
                )}
                {challenges.length > 0 ? challenges.slice(0, 3).map((item, i) => (
                    <View key={i} style={styles.challengeCard}>
                        <View style={styles.challengeHeader}>
                            <Trophy size={24} color={COLORS.primary} />
                            <View style={styles.challengeInfo}>
                                <Text style={styles.challengeTitle}>{item.title}</Text>
                                <Text style={styles.challengeReward}>{item.reward} Kudos Reward</Text>
                            </View>
                        </View>
                        <Text style={styles.challengeDesc}>{item.description}</Text>
                    </View>
                )) : (
                    <View style={styles.emptyState}>
                        <Trophy size={48} color={COLORS.surface} />
                        <Text style={styles.emptyText}>No challenges active.</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );

    if (!squad) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            {activeTab === 'feed' && renderFeed()}
            {activeTab === 'members' && renderMembers()}
            {activeTab === 'challenges' && renderChallenges()}
            {activeTab === 'leaderboard' && (
                <ScrollView>
                    {renderHeader()}
                    <View style={styles.leaderboardList}>
                        {leaderboard.map((item, index) => (
                            <View key={item.userId} style={styles.leaderboardRow}>
                                <Text style={styles.rankText}>{index + 1}</Text>
                                <Image source={{ uri: item.avatar || 'https://via.placeholder.com/100' }} style={styles.leaderboardAvatar} />
                                <View style={styles.leaderboardInfo}>
                                    <Text style={styles.leaderboardName}>{item.username}</Text>
                                    <Text style={styles.leaderboardCoins}>{item.coins} Kudos</Text>
                                </View>
                                {index === 0 && <Trophy size={20} color={COLORS.primary} />}
                            </View>
                        ))}
                    </View>
                    {leaderboard.length === 0 && (
                        <View style={styles.emptyState}>
                            <Trophy size={48} color={COLORS.surface} />
                            <Text style={styles.emptyText}>Rankings will update as members join!</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Admin Modal */}
            <Modal visible={showAdminModal} animationType="slide">
                <SafeAreaView style={styles.adminModal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Squad Management</Text>
                        <TouchableOpacity onPress={() => setShowAdminModal(false)}>
                            <LogOut color={COLORS.white} size={24} style={{ transform: [{ rotate: '45deg' }] }} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalForm}>
                        <TouchableOpacity
                            style={styles.imageEditBtn}
                            onPress={() => Alert.alert('Pick Image', 'Image picker will open here.')}
                        >
                            <Camera color={COLORS.primary} size={32} />
                            <Text style={styles.imageEditBtnText}>Change Squad Picture</Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>Squad Name</Text>
                        <TextInput style={styles.input} value={editName} onChangeText={setEditName} />

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            value={editDesc}
                            onChangeText={setEditDesc}
                            multiline
                        />

                        <Text style={styles.label}>Squad Rules</Text>
                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            value={editRules}
                            onChangeText={setEditRules}
                            multiline
                            placeholder="Set guidelines for members..."
                            placeholderTextColor={COLORS.textSecondary}
                        />

                        <Text style={styles.label}>Subscription Price (Monthly)</Text>
                        <TextInput
                            style={styles.input}
                            value={editPrice}
                            onChangeText={setEditPrice}
                            placeholder="e.g. £4.99"
                            placeholderTextColor={COLORS.textSecondary}
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateSquad}>
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Paywall Modal */}
            <Modal visible={showPaywall} transparent animationType="slide">
                <View style={styles.paywallOverlay}>
                    {squad && (
                        <View style={styles.paywallCard}>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPaywall(false)}>
                                <LogOut color={COLORS.textSecondary} size={24} style={{ transform: [{ rotate: '45deg' }] }} />
                            </TouchableOpacity>
                            <Lock color={COLORS.primary} size={64} style={{ marginBottom: 16 }} />
                            <Text style={styles.paywallTitle}>Unlock {squad.name} Premium</Text>
                            <Text style={styles.paywallPrice}>{squad.price || '£4.99'}/month</Text>

                            <View style={styles.benefits}>
                                <Text style={styles.benefitText}>• Exclusive coaching videos</Text>
                                <Text style={styles.benefitText}>• Direct messaging access</Text>
                                <Text style={styles.benefitText}>• Monthly squad challenges</Text>
                                <Text style={styles.benefitText}>• Premium member badge</Text>
                            </View>

                            <TouchableOpacity style={styles.payBtn} onPress={handlePremiumPurchase} disabled={processingPayment}>
                                {processingPayment ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.payBtnText}>Subscribe Now</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Create Challenge Modal */}
            <Modal visible={showCreateChallenge} animationType="slide" transparent>
                <View style={[styles.paywallOverlay, { padding: SPACING.lg }]}>
                    <View style={styles.paywallCard}>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Challenge Title"
                            placeholderTextColor={COLORS.textSecondary}
                            value={challengeTitle}
                            onChangeText={setChallengeTitle}
                        />
                        <TextInput
                            style={[styles.modalInput, { height: 80 }]}
                            multiline
                            placeholder="Description"
                            placeholderTextColor={COLORS.textSecondary}
                            value={challengeDesc}
                            onChangeText={setChallengeDesc}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Reward (Kudos)"
                            keyboardType="numeric"
                            placeholderTextColor={COLORS.textSecondary}
                            value={challengeReward}
                            onChangeText={setChallengeReward}
                        />
                        <View style={styles.modalActionRow}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateChallenge(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={async () => {
                                if (!challengeTitle || !challengeDesc || !challengeReward) {
                                    Alert.alert('Error', 'Please fill all fields');
                                    return;
                                }
                                try {
                                    await squadService.createChallenge(squadId, {
                                        title: challengeTitle,
                                        description: challengeDesc,
                                        reward: parseInt(challengeReward),
                                        durationDays: 7
                                    });
                                    Alert.alert('Challenge Created', 'Your squad members have been notified!');
                                    setShowCreateChallenge(false);
                                    setChallengeTitle('');
                                    setChallengeDesc('');
                                    setChallengeReward('');
                                    loadChallenges();
                                } catch (e) {
                                    Alert.alert('Error', 'Failed to create challenge');
                                }
                            }}>
                                <Text style={styles.confirmBtnText}>Create</Text>
                            </TouchableOpacity>
                        </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    bannerContainer: {
        height: 240,
        width: '100%',
    },
    banner: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    backBtn: {
        position: 'absolute',
        top: 20,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: SPACING.lg,
        marginTop: -30,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    squadName: {
        fontSize: 28,
        fontFamily: FONTS.display.bold,
        color: COLORS.white,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    premiumText: {
        fontSize: 10,
        fontFamily: FONTS.display.bold,
        color: COLORS.background,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: SPACING.md,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontFamily: FONTS.body.regular,
    },
    description: {
        color: COLORS.textSecondary,
        fontSize: 15,
        lineHeight: 22,
        marginBottom: SPACING.lg,
        fontFamily: FONTS.body.regular,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: SPACING.lg,
    },
    tag: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        color: COLORS.primary,
        fontSize: 12,
        fontFamily: FONTS.body.semiBold,
    },
    joinBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
    },
    joinBtnText: {
        color: COLORS.background,
        fontSize: 18,
        fontFamily: FONTS.display.bold,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: SPACING.xl,
    },
    actionBtn: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionBtnText: {
        color: COLORS.background,
        fontFamily: FONTS.display.semiBold,
        fontSize: 16,
    },
    secondaryActionBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1.5,
        borderColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface,
        marginBottom: SPACING.md,
    },
    tab: {
        marginRight: 24,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        color: COLORS.textSecondary,
        fontFamily: FONTS.display.medium,
    },
    activeTabText: {
        color: COLORS.primary,
    },
    listContent: {
        paddingBottom: 40,
    },
    postCard: {
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        borderRadius: 20,
        padding: SPACING.md,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    postAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
    },
    postUsername: {
        color: COLORS.white,
        fontFamily: FONTS.body.bold,
    },
    postCaption: {
        color: COLORS.white,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
        fontFamily: FONTS.body.regular,
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postFooterText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginLeft: 6,
        fontFamily: FONTS.body.regular,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: COLORS.textSecondary,
        marginTop: 16,
        fontFamily: FONTS.body.regular,
    },
    memberList: {
        padding: SPACING.lg,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 16,
    },
    memberAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    avatarText: {
        color: COLORS.primary,
        fontFamily: FONTS.display.bold,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        color: COLORS.white,
        fontFamily: FONTS.display.semiBold,
        fontSize: 16,
    },
    memberRole: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontFamily: FONTS.body.regular,
    },
    challengeSection: {
        padding: SPACING.lg,
    },
    addChallengeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        borderRadius: 12,
        borderStyle: 'dashed',
        marginBottom: 20,
    },
    addChallengeText: {
        color: COLORS.primary,
        fontFamily: FONTS.display.semiBold,
    },
    challengeCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: SPACING.md,
        marginBottom: 16,
    },
    challengeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    challengeInfo: {
        marginLeft: 12,
    },
    challengeTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontFamily: FONTS.display.bold,
    },
    challengeReward: {
        color: COLORS.primary,
        fontSize: 14,
        fontFamily: FONTS.body.semiBold,
    },
    challengeDesc: {
        color: COLORS.textSecondary,
        lineHeight: 20,
        fontFamily: FONTS.body.regular,
    },
    adminModal: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surface,
    },
    modalTitle: {
        color: COLORS.white,
        fontSize: 20,
        fontFamily: FONTS.display.bold,
    },
    modalForm: {
        padding: SPACING.lg,
    },
    imageEditBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        marginBottom: 8,
    },
    imageEditBtnText: {
        color: COLORS.primary,
        marginTop: 8,
        fontFamily: FONTS.body.semiBold,
    },
    label: {
        color: COLORS.white,
        fontSize: 14,
        fontFamily: FONTS.body.semiBold,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 12,
        color: COLORS.white,
        fontSize: 16,
        fontFamily: FONTS.body.regular,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 60,
    },
    saveBtnText: {
        color: COLORS.background,
        fontSize: 18,
        fontFamily: FONTS.display.bold,
    },
    paywallOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paywallCard: {
        width: '90%',
        backgroundColor: COLORS.surface,
        borderRadius: 30,
        padding: 30,
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
    },
    paywallTitle: {
        color: COLORS.white,
        fontSize: 24,
        fontFamily: FONTS.display.bold,
        textAlign: 'center',
    },
    paywallPrice: {
        fontSize: 36,
        color: COLORS.primary,
        fontFamily: FONTS.display.bold,
        marginVertical: 12,
    },
    benefits: {
        width: '100%',
        marginVertical: 20,
    },
    benefitText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        marginBottom: 10,
        fontFamily: FONTS.body.regular,
    },
    payBtn: {
        width: '100%',
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    payBtnText: {
        color: COLORS.background,
        fontSize: 18,
        fontFamily: FONTS.display.bold,
    },
    modalInput: {
        width: '100%',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 12,
        color: COLORS.white,
        marginBottom: 12,
        fontFamily: FONTS.body.regular,
    },
    modalActionRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginTop: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        color: COLORS.white,
        fontFamily: FONTS.body.regular,
    },
    confirmBtn: {
        flex: 2,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnText: {
        color: COLORS.background,
        fontFamily: FONTS.display.semiBold,
    },
    leaderboardList: {
        padding: SPACING.lg,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    rankText: {
        color: COLORS.primary,
        fontSize: 18,
        fontFamily: FONTS.display.bold,
        width: 30,
    },
    leaderboardAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginHorizontal: 12,
    },
    leaderboardInfo: {
        flex: 1,
    },
    leaderboardName: {
        color: COLORS.white,
        fontFamily: FONTS.display.semiBold,
        fontSize: 16,
    },
    leaderboardCoins: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontFamily: FONTS.body.regular,
    },
});

export default SquadDetailScreen;
