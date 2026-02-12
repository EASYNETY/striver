import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, RefreshControl, Alert, Modal, Share, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { Search, Plus, Users, UserPlus, ShieldAlert, ShieldCheck, Settings, Share2, X, CheckCircle, Clock, AlertTriangle } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import squadService, { Squad } from '../../api/squadService';
import userService from '../../api/userService';
import { firebaseAuth } from '../../api/firebase';
import squadWaitlistService from '../../api/squadWaitlistService';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const SquadsScreen = ({ navigation, route }: any) => {
    const isFocused = useIsFocused();
    const [activeTab, setActiveTab] = useState('Explore');
    const [squads, setSquads] = useState<Squad[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [userProfile, setUserProfile] = useState<any>(null);

    // REQUEST MODAL STATE
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected' | 'revoked' | 'success'>('none');
    const [requestLoading, setRequestLoading] = useState(false);


    // Initial check for deep link params
    useEffect(() => {
        if (route.params?.request === true) {
            checkWaitlistStatus();
            setShowRequestModal(true);
            navigation.setParams({ request: undefined });
        }
    }, [route.params]);

    useEffect(() => {
        if (isFocused) {
            const params = route.params;
            if (params?.initialTab) {
                setActiveTab(params.initialTab);
            }
            loadUserProfile();
            loadSquads(params?.premiumOnly);
            checkWaitlistStatus();
        }
    }, [isFocused, activeTab, route.params]);

    const checkWaitlistStatus = async () => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
            const req = await squadWaitlistService.getUserRequest(currentUser.uid);
            if (req) {
                setRequestStatus(req.status as any);
            } else {
                setRequestStatus('none');
            }
        }
    };

    const loadUserProfile = async () => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
            const profile = await userService.getUserProfile(currentUser.uid);
            setUserProfile(profile);
        }
    };

    const canViewSquad = (squad: Squad): boolean => {
        if (!userProfile) return true; // Show all if profile not loaded yet

        // Check age restriction
        if (squad.ageRestriction === '18+') {
            return userProfile.ageTier === 'first_teamer';
        } else if (squad.ageRestriction === '13+') {
            return userProfile.ageTier !== 'junior_baller';
        }
        return true; // 'all' age restriction
    };

    const loadSquads = async (premiumOnly = false) => {
        setLoading(true);
        try {
            let fetchedSquads: Squad[] = [];

            if (activeTab === 'Explore') {
                fetchedSquads = await squadService.getAllSquads();
                if (premiumOnly) {
                    fetchedSquads = fetchedSquads.filter(s => s.isPremium);
                }
            } else {
                const currentUser = firebaseAuth.currentUser;
                if (currentUser) {
                    fetchedSquads = await squadService.getUserSquads(currentUser.uid);
                }
            }

            setSquads(fetchedSquads);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadSquads();
    };

    const handleJoinWithCode = async () => {
        if (!inviteCode.trim()) return;

        try {
            const squadId = await squadService.joinSquadWithCode(inviteCode.trim().toUpperCase());
            Alert.alert('Success', 'You joined the private squad!');
            navigation.navigate('SquadDetail', { squadId });
            setInviteCode('');
        } catch (error) {
            Alert.alert('Error', 'Invalid invite code or already a member.');
        }
    };

    const handleCreatePress = () => {
        navigation.navigate('CreateSquad');
    };

    const handleSquadPress = (squadId: string) => {
        navigation.navigate('SquadDetail', { squadId });
    };

    const insets = useSafeAreaInsets();

    const handleRequestPress = () => {
        setShowRequestModal(true);
    };

    const handleJoinWaitlist = async () => {
        setRequestLoading(true);
        try {
            const result = await squadWaitlistService.submitRequest();
            if (result.success) {
                setRequestStatus('success');
                // Don't close modal immediately, let them see success
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (error) {
            console.error('[SquadsScreen] Request failed:', error);
            Alert.alert('Error', 'Failed to join waitlist. Please try again.');
        } finally {
            setRequestLoading(false);
        }
    };

    const handleRevokeRequest = async () => {
        Alert.alert(
            'Revoke Access',
            'Are you sure you want to revoke your squad creation access/request? You will need to apply again.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Revoke',
                    style: 'destructive',
                    onPress: async () => {
                        setRequestLoading(true);
                        const currentUser = firebaseAuth.currentUser;
                        if (currentUser) {
                            const result = await squadWaitlistService.cancelUserRequest(currentUser.uid);
                            if (result.success) {
                                setRequestStatus('none');
                                Alert.alert('Success', 'Access revoked.');
                                setShowRequestModal(false);
                            } else {
                                Alert.alert('Error', result.message);
                            }
                        }
                        setRequestLoading(false);
                    }
                }
            ]
        );
    };

    const handleShareRequest = async () => {
        const deepLink = 'https://striver-links.web.app/squads?request=true';
        try {
            await Share.share({
                message: `Join the Striver Squad Creator Waitlist! Check it out here: ${deepLink}`,
                url: deepLink, // iOS
                title: 'Striver Squad Request'
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <DiagonalStreaksBackground />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Squads</Text>
                <TouchableOpacity style={styles.createBtn} onPress={handleRequestPress}>
                    <Plus color={COLORS.background} size={20} />
                    <Text style={styles.createBtnText}>Request</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
                <Search color={COLORS.textSecondary} size={20} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search squads..."
                    placeholderTextColor={COLORS.textSecondary}
                />
            </View>

            <View style={styles.tabs}>
                {['Explore', 'My Squads'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
                }
            >
                {activeTab === 'Explore' ? (
                    <Text style={styles.sectionTitle}>Trending Squads</Text>
                ) : (
                    <Text style={styles.sectionTitle}>Your Squads ({squads.length})</Text>
                )}

                {squads.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            {activeTab === 'Explore' ? 'No squads found.' : 'You haven\'t joined any squads yet.'}
                        </Text>
                    </View>
                )}

                {squads.filter(canViewSquad).map(squad => {
                    const currentUser = firebaseAuth.currentUser;
                    const isMember = currentUser && squad.members?.includes(currentUser.uid);
                    const isCreator = currentUser && squad.creatorId === currentUser.uid;

                    return (
                        <TouchableOpacity
                            key={squad.id}
                            style={styles.squadCard}
                            onPress={() => handleSquadPress(squad.id)}
                        >
                            <Image
                                source={{ uri: squad.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400' }}
                                style={styles.squadImage}
                            />
                            <View style={styles.squadInfo}>
                                <View style={styles.squadHeader}>
                                    <Text style={styles.squadName}>{squad.name}</Text>
                                    {isCreator && (
                                        <View style={styles.leaderBadge}>
                                            <ShieldCheck color={COLORS.background} size={10} />
                                            <Text style={styles.leaderBadgeText}>LEADER</Text>
                                        </View>
                                    )}
                                    {squad.ageRestriction && squad.ageRestriction !== 'all' && (
                                        <View style={styles.ageRestrictionBadge}>
                                            <ShieldAlert color={COLORS.background} size={10} />
                                            <Text style={styles.ageRestrictionBadgeText}>{squad.ageRestriction}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.squadDesc} numberOfLines={2}>{squad.description}</Text>
                                <View style={styles.squadStats}>
                                    <View style={styles.stat}>
                                        <Users color={COLORS.textSecondary} size={14} />
                                        <Text style={styles.statText}>{squad.memberCount || 0}</Text>
                                    </View>
                                </View>
                            </View>
                            {isCreator ? (
                                <TouchableOpacity
                                    style={styles.manageBtn}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        navigation.navigate('SquadDetail', { squadId: squad.id, autoOpenAdmin: true });
                                    }}
                                >
                                    <Settings color={COLORS.primary} size={20} />
                                </TouchableOpacity>
                            ) : !isMember && (
                                <TouchableOpacity
                                    style={styles.joinBtn}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleSquadPress(squad.id);
                                    }}
                                >
                                    <UserPlus color={COLORS.primary} size={20} />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    );
                })}

                {activeTab === 'Explore' && (
                    <View style={styles.inviteCard}>
                        <Text style={styles.inviteTitle}>Have an invite code?</Text>
                        <Text style={styles.inviteSubtitle}>Join a private squad with your mates</Text>
                        <View style={styles.inviteInputContainer}>
                            <TextInput
                                style={styles.inviteInput}
                                placeholder="Enter Code"
                                placeholderTextColor={COLORS.textSecondary}
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity style={styles.submitCodeBtn} onPress={handleJoinWithCode}>
                                <Text style={styles.submitCodeText}>Join</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Dynamic Request Status Modal */}
            <Modal
                visible={showRequestModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRequestModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setShowRequestModal(false)}
                        >
                            <X color={COLORS.textSecondary} size={24} />
                        </TouchableOpacity>

                        {/* SUCCESS STATE */}
                        {requestStatus === 'success' && (
                            <>
                                <View style={[styles.modalIconContainer, { borderColor: COLORS.primary, backgroundColor: 'rgba(143, 251, 185, 0.1)' }]}>
                                    <CheckCircle color={COLORS.primary} size={40} />
                                </View>
                                <Text style={styles.modalTitle}>You're on the list!</Text>
                                <Text style={styles.modalDescription}>
                                    We have received your request to become a squad creator. We will review your profile and notify you once approved.
                                </Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowRequestModal(false)}>
                                        <Text style={styles.primaryBtnText}>Got it</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* PENDING STATE */}
                        {requestStatus === 'pending' && (
                            <>
                                <View style={[styles.modalIconContainer, { borderColor: '#FF9500', backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
                                    <Clock color="#FF9500" size={40} />
                                </View>
                                <Text style={styles.modalTitle}>Request Pending</Text>
                                <Text style={styles.modalDescription}>
                                    Your request is currently under review by our team. This usually takes 24-48 hours.
                                </Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowRequestModal(false)}>
                                        <Text style={styles.primaryBtnText}>Close</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.shareBtn, { borderColor: '#FF453A' }]} onPress={handleRevokeRequest}>
                                        <Text style={[styles.shareBtnText, { color: '#FF453A' }]}>Cancel Request</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* APPROVED STATE */}
                        {requestStatus === 'approved' && (
                            <>
                                <View style={[styles.modalIconContainer, { borderColor: COLORS.primary, backgroundColor: 'rgba(143, 251, 185, 0.1)' }]}>
                                    <ShieldCheck color={COLORS.primary} size={40} />
                                </View>
                                <Text style={styles.modalTitle}>You're Approved!</Text>
                                <Text style={styles.modalDescription}>
                                    Congratulations! You have been granted access to create squads.
                                </Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={() => { setShowRequestModal(false); navigation.navigate('CreateSquad'); }}>
                                        <Text style={styles.primaryBtnText}>Create Squad</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.shareBtn, { borderColor: '#FF453A' }]} onPress={handleRevokeRequest}>
                                        <Text style={[styles.shareBtnText, { color: '#FF453A' }]}>Revoke Access</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* REJECTED STATE */}
                        {requestStatus === 'rejected' && (
                            <>
                                <View style={[styles.modalIconContainer, { borderColor: '#FF453A', backgroundColor: 'rgba(255, 69, 58, 0.1)' }]}>
                                    <AlertTriangle color="#FF453A" size={40} />
                                </View>
                                <Text style={styles.modalTitle}>Request Update</Text>
                                <Text style={styles.modalDescription}>
                                    Unfortunately, your request to become a squad creator was not approved at this time.
                                </Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowRequestModal(false)}>
                                        <Text style={styles.primaryBtnText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* INITIAL / NONE / REVOKED STATE */}
                        {(requestStatus === 'none' || requestStatus === 'revoked') && (
                            <>
                                <View style={styles.modalIconContainer}>
                                    <ShieldCheck color={COLORS.primary} size={40} />
                                </View>
                                <Text style={styles.modalTitle}>Request a Squad</Text>
                                <Text style={styles.modalDescription}>
                                    Building a quality community is our top priority. New squad creation is currently by request only.
                                </Text>
                                <Text style={styles.modalDescription}>
                                    Would you like to join the exclusive creator waitlist?
                                </Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={handleJoinWaitlist} disabled={requestLoading}>
                                        {requestLoading ? (
                                            <Text style={styles.primaryBtnText}>Processing...</Text>
                                        ) : (
                                            <Text style={styles.primaryBtnText}>Join Waitlist</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.shareBtn} onPress={handleShareRequest}>
                                        <Share2 color={COLORS.white} size={18} />
                                        <Text style={styles.shareBtnText}>Share Link</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View >
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
        fontFamily: FONTS.display.bold,
        color: COLORS.white,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    createBtnText: {
        fontSize: 14,
        fontFamily: FONTS.display.semiBold,
        color: COLORS.background,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.md,
        paddingHorizontal: SPACING.md,
        height: 48,
        borderRadius: 12,
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    searchInput: {
        flex: 1,
        color: COLORS.white,
        fontSize: 15,
        fontFamily: FONTS.body.regular,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.md,
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    tab: {
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 16,
        fontFamily: FONTS.display.medium,
        color: COLORS.textSecondary,
    },
    tabTextActive: {
        color: COLORS.primary,
    },
    content: {
        padding: SPACING.md,
        paddingBottom: 100, // Account for tab bar + safe area
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: FONTS.display.semiBold,
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    squadCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.sm,
        marginBottom: SPACING.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    squadImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: COLORS.background,
    },
    squadInfo: {
        flex: 1,
        marginLeft: SPACING.md,
        marginRight: SPACING.sm,
    },
    squadHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    squadName: {
        fontSize: 16,
        fontFamily: FONTS.display.semiBold,
        color: COLORS.white,
    },
    ageRestrictionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF9500',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    ageRestrictionBadgeText: {
        fontSize: 8,
        fontFamily: FONTS.display.bold,
        color: COLORS.background,
    },
    leaderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    leaderBadgeText: {
        fontSize: 8,
        fontFamily: FONTS.display.bold,
        color: COLORS.background,
    },
    manageBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
    },
    squadDesc: {
        fontSize: 13,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    squadStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
    },
    joinBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inviteCard: {
        padding: SPACING.lg,
        backgroundColor: 'rgba(143, 251, 185, 0.05)',
        borderRadius: 20,
        marginTop: SPACING.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.1)',
    },
    inviteTitle: {
        fontSize: 18,
        fontFamily: FONTS.display.bold,
        color: COLORS.white,
    },
    inviteSubtitle: {
        fontSize: 13,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
        marginTop: 4,
        marginBottom: SPACING.lg,
    },
    inviteInputContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    inviteInput: {
        flex: 1,
        height: 48,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        color: COLORS.white,
        fontSize: 15,
        fontFamily: FONTS.body.regular,
    },
    submitCodeBtn: {
        paddingHorizontal: 20,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitCodeText: {
        fontFamily: FONTS.display.semiBold,
        color: COLORS.background,
    },
    emptyState: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontFamily: FONTS.body.regular,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: SPACING.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        position: 'relative',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
        zIndex: 10,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.2)',
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: FONTS.display.bold,
        color: COLORS.white,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 15,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
        lineHeight: 22,
    },
    modalActions: {
        width: '100%',
        gap: 12,
        marginTop: SPACING.xl,
    },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    primaryBtnText: {
        fontSize: 16,
        fontFamily: FONTS.display.semiBold,
        color: COLORS.background,
    },
    shareBtn: {
        flexDirection: 'row',
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        gap: 8,
    },
    shareBtnText: {
        fontSize: 16,
        fontFamily: FONTS.display.medium,
        color: COLORS.white,
    },
});

export default SquadsScreen;
