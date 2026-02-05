import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Dimensions, Share, Alert } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { Settings as SettingsIcon, Search, Share2, Edit3, Trophy, Grid, MessageSquare, ShieldCheck, LogOut, ChevronLeft, UserPlus, UserCheck, Star } from 'lucide-react-native';
import { useIsFocused, useRoute } from '@react-navigation/native';
import userService, { UserProfile } from '../../api/userService';
import postService, { Post } from '../../api/postService';
import { firebaseAuth } from '../../api/firebase';
import { shareContent } from '../../utils/deepLink';
import { CAREER_TIERS, BADGE_TIERS } from '../../constants/rewards';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 32 - 4) / 3;

const ProfileScreen = ({ navigation }: any) => {
    const isFocused = useIsFocused();
    const route = useRoute<any>();
    const userId = route.params?.userId;

    const [activeTab, setActiveTab] = useState('Videos');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followingLoading, setFollowingLoading] = useState(false);

    const loadProfileData = useCallback(() => {
        const currentUid = firebaseAuth.currentUser?.uid;
        const targetUid = userId || currentUid;

        console.log('[ProfileScreen] Loading profile for:', targetUid || 'NONE', 'Self:', currentUid || 'NONE');

        if (!targetUid) {
            // Wait for auth to settle if viewing own profile
            if (!userId) {
                console.log('[ProfileScreen] No targetUid and no userId, waiting for auth...');
            } else {
                setLoading(false);
            }
            return undefined;
        }

        setIsCurrentUser(targetUid === currentUid);
        setLoading(true);

        return userService.onProfileChange(targetUid, async (userProfile) => {
            console.log('[ProfileScreen] Profile received:', userProfile ? userProfile.username : 'NULL');
            if (userProfile) {
                setProfile(userProfile);
                if (currentUid && targetUid !== currentUid) {
                    const following = await userService.isFollowing(currentUid, targetUid);
                    setIsFollowing(following);
                }
            } else if (targetUid === currentUid) {
                console.log('[ProfileScreen] Own profile missing, attempting auto-create...');
                const profileDoc = await userService.getCurrentUserProfile();
                if (profileDoc) {
                    setProfile(profileDoc);
                }
            }
            setLoading(false);
        });
    }, [userId]);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        // Use a small delay or watch auth state to ensure we have a UID
        const run = () => {
            if (unsubscribe) unsubscribe();
            unsubscribe = loadProfileData() as any;
        };

        if (isFocused) {
            run();
        }

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [isFocused, userId, firebaseAuth.currentUser?.uid]);

    useEffect(() => {
        if (profile) {
            loadUserPosts();
        }
    }, [profile, activeTab]);

    const loadUserPosts = async () => {
        if (!profile) {
            setLoading(false);
            return;
        }
        try {
            const userPosts = await postService.getUserPosts(profile.uid);
            setPosts(userPosts);
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShareProfile = async () => {
        if (!profile) return;
        await shareContent(
            `${profile.username}'s Profile`,
            `Check out ${profile.username} on Striver!`,
            'profile',
            profile.uid
        );
    };

    const handleFollowToggle = async () => {
        const currentUid = firebaseAuth.currentUser?.uid;
        if (!currentUid || !profile || followingLoading) return;

        setFollowingLoading(true);
        try {
            if (isFollowing) {
                await userService.unfollowUser(currentUid, profile.uid);
                setIsFollowing(false);
            } else {
                await userService.followUser(currentUid, profile.uid);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Follow error:', error);
        } finally {
            setFollowingLoading(false);
        }
    };

    const renderVideosTab = () => (
        <View style={styles.videoGrid}>
            {posts.length === 0 && !loading ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No videos yet</Text>
                </View>
            ) : (
                posts.map((post) => (
                    <TouchableOpacity
                        key={post.id}
                        style={styles.gridItem}
                        onPress={() => {
                            try {
                                if (!profile || !post || !post.id) {
                                    console.error('[ProfileScreen] Invalid data for navigation:', { profile, post });
                                    Alert.alert('Error', 'Unable to load video. Please try again.');
                                    return;
                                }

                                console.log('[ProfileScreen] Navigating to Feed:', {
                                    userId: profile.uid,
                                    postId: post.id
                                });

                                navigation.navigate('Feed', {
                                    userId: profile.uid,
                                    initialPostId: post.id,
                                    posts: posts // Pass all posts for context
                                });
                            } catch (error) {
                                console.error('[ProfileScreen] Navigation error:', error);
                                Alert.alert('Error', 'Failed to open video. Please try again.');
                            }
                        }}
                    >
                        <Image
                            source={{ uri: post.thumbnailUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=200' }}
                            style={styles.gridImage}
                        />
                        <View style={styles.gridOverlay}>
                            <Text style={styles.gridStats}>❤️ {post.likes}</Text>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );

    const renderPlaceholderTab = (name: string) => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No {name.toLowerCase()} yet</Text>
        </View>
    );

    if (!profile) return (
        <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: COLORS.white }}>
                {loading ? 'Loading Profile...' : 'Failed to load profile. Please check your connection.'}
            </Text>
            {!loading && (
                <TouchableOpacity
                    onPress={loadProfileData}
                    style={{ marginTop: 20, padding: 10, backgroundColor: COLORS.primary, borderRadius: 8 }}
                >
                    <Text style={{ color: COLORS.background, fontWeight: 'bold' }}>Retry</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {navigation.canGoBack() && (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
                            <ChevronLeft color={COLORS.white} size={24} />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.headerRight}>
                    {isCurrentUser && (
                        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.circleBtn}>
                            <SettingsIcon color={COLORS.white} size={20} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleShareProfile} style={styles.circleBtn}>
                        <Share2 color={COLORS.white} size={20} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileInfo}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: profile.avatar || `https://ui-avatars.com/api/?name=${profile.username}` }}
                            style={[styles.avatar, { borderColor: CAREER_TIERS.find(t => t.id === profile.career_tier_id)?.color || COLORS.primary }]}
                        />
                        <View style={[styles.tierBadge, { backgroundColor: CAREER_TIERS.find(t => t.id === profile.career_tier_id)?.color || COLORS.primary }]}>
                            {['legend', 'goat'].includes(profile.career_tier_id) ? (
                                <Star color={COLORS.background} size={12} fill={COLORS.background} />
                            ) : (
                                <Trophy color={COLORS.background} size={12} />
                            )}
                            <Text style={styles.tierName}>
                                {(CAREER_TIERS.find(t => t.id === profile.career_tier_id)?.name || 'Future Star').toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.username}>{profile.displayName || `@${profile.username}`}</Text>
                    {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

                    {isCurrentUser ? (
                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <Edit3 color={COLORS.background} size={16} />
                            <Text style={styles.editBtnText}>Edit Profile</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.editBtn, isFollowing && styles.followingBtn]}
                            onPress={handleFollowToggle}
                            disabled={followingLoading}
                        >
                            {isFollowing ? (
                                <UserCheck color={COLORS.white} size={16} />
                            ) : (
                                <UserPlus color={COLORS.background} size={16} />
                            )}
                            <Text style={[styles.editBtnText, isFollowing && { color: COLORS.white }]}>
                                {isFollowing ? 'Following' : 'Follow'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {isCurrentUser && profile?.accountType === 'family' && profile?.activeProfileId && (
                        <TouchableOpacity
                            style={[styles.editBtn, { backgroundColor: COLORS.surface, marginTop: 12, borderWidth: 1, borderColor: COLORS.primary }]}
                            onPress={async () => {
                                const currentUser = firebaseAuth.currentUser;
                                if (currentUser) {
                                    await userService.switchActiveProfile(currentUser.uid, null);
                                    navigation.navigate('HomeFeed');
                                }
                            }}
                        >
                            <ShieldCheck color={COLORS.primary} size={16} />
                            <Text style={[styles.editBtnText, { color: COLORS.primary }]}>Switch to Parent Mode</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{profile.followers}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{profile.following}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{profile.replies}</Text>
                        <Text style={styles.statLabel}>Replies</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{profile.coins}</Text>
                        <Text style={styles.statLabel}>Coins</Text>
                    </View>
                </View>

                <View style={styles.tabsSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                        {['Videos', 'Replies', 'Challenges', 'Coins'].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {activeTab === 'Videos' && renderVideosTab()}
                {activeTab !== 'Videos' && renderPlaceholderTab(activeTab)}
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
        justifyContent: 'space-between',
        padding: SPACING.md,
    },
    content: {
        paddingBottom: SPACING.xl,
    },
    profileInfo: {
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.surface,
    },
    tierBadge: {
        position: 'absolute',
        bottom: -5,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 3,
        borderColor: COLORS.background,
    },
    tierName: {
        fontSize: 10,
        fontFamily: FONTS.display.bold,
        color: COLORS.background,
    },
    username: {
        fontSize: 22,
        fontFamily: FONTS.display.bold,
        color: COLORS.white,
        marginBottom: 4,
    },
    bio: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.xl,
        fontFamily: FONTS.body.regular,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
        marginTop: SPACING.sm,
    },
    editBtnText: {
        fontSize: 14,
        fontFamily: FONTS.display.semiBold,
        color: COLORS.background,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontFamily: FONTS.display.bold,
        color: COLORS.white,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
        fontFamily: FONTS.body.regular,
    },
    tabsSection: {
        marginBottom: 2,
    },
    tabsScroll: {
        paddingHorizontal: SPACING.md,
        gap: SPACING.md,
        height: 50,
    },
    tabBtn: {
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    tabBtnActive: {
        borderBottomWidth: 3,
        borderBottomColor: COLORS.primary,
    },
    tabBtnText: {
        fontSize: 15,
        fontFamily: FONTS.display.medium,
        color: COLORS.textSecondary,
    },
    tabBtnTextActive: {
        color: COLORS.white,
    },
    videoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        paddingHorizontal: 16,
        marginTop: 10,
    },
    gridItem: {
        width: GRID_SIZE,
        height: GRID_SIZE,
        backgroundColor: COLORS.surface,
    },
    gridImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'flex-end',
        padding: 6,
    },
    gridStats: {
        color: COLORS.white,
        fontSize: 10,
        fontFamily: FONTS.body.bold,
    },
    emptyState: {
        width: '100%',
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontFamily: FONTS.body.regular,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    circleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    followingBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    }
});

export default ProfileScreen;
