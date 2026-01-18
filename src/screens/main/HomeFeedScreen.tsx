import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, StatusBar, Text, TouchableOpacity, Image, Share, RefreshControl, Modal, SafeAreaView, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { COLORS, SPACING } from '../../constants/theme';
import { Heart, MessageCircle, Share2, Search, Bell, Coins, ShieldCheck, X, UserPlus, UserCheck } from 'lucide-react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import postService, { Post } from '../../api/postService';
import userService, { UserProfile } from '../../api/userService';
import rewardService from '../../api/rewardService';
import { firebaseAuth } from '../../api/firebase';
import { shareContent } from '../../utils/deepLink';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

const HomeFeedScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const [activeTab, setActiveTab] = useState<'For You' | 'Following'>('For You');
    const [posts, setPosts] = useState<Post[]>([]);
    const [userCoins, setUserCoins] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isChildMode, setIsChildMode] = useState(false);
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [visibleItemIndex, setVisibleItemIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [showSearch, setShowSearch] = useState(false);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80
    }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index;
            if (index !== visibleItemIndex) {
                setVisibleItemIndex(index);
                // Track video watch
                rewardService.updateTaskProgress('watch_5_videos', 1).catch(console.error);
            }
        }
    }).current;

    useEffect(() => {
        // Track daily login
        rewardService.updateTaskProgress('daily_login', 1).catch(console.error);
    }, []);

    useEffect(() => {
        let unsubscribe: () => void;
        if (activeTab === 'For You') {
            unsubscribe = postService.subscribeToFeedPosts((updatedPosts) => {
                setPosts(updatedPosts);
                setLoading(false);
                setRefreshing(false);
            });
        } else {
            unsubscribe = postService.subscribeToFollowingFeed((updatedPosts) => {
                setPosts(updatedPosts);
                setLoading(false);
                setRefreshing(false);

                // Track following status
                const currentUser = firebaseAuth.currentUser;
                if (currentUser && updatedPosts.length > 0) {
                    const ids = new Set<string>();
                    updatedPosts.forEach(post => ids.add(post.userId));
                    setFollowingIds(ids);
                }
            });
        }
        return () => unsubscribe?.();
    }, [activeTab]);

    useEffect(() => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser && isFocused) {
            const unsubscribe = userService.onProfileChange(currentUser.uid, (profile) => {
                if (profile) {
                    setUserCoins(profile.coins);
                    setIsChildMode(!!(profile.accountType === 'family' && profile.activeProfileId));
                }
            });
            return () => unsubscribe();
        }
    }, [isFocused]);

    const loadData = async () => {
        setLoading(true);
        try {
            let fetchedPosts: Post[] = [];
            if (activeTab === 'For You') {
                fetchedPosts = await postService.getFeedPosts();
            } else {
                fetchedPosts = await postService.getFollowingFeed();
            }
            setPosts(fetchedPosts);
        } catch (error) {
            console.error('Error loading feed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const toggleLike = async (postId: string) => {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return;

        const isLiked = likedPosts.has(postId);
        try {
            if (isLiked) {
                setLikedPosts(prev => {
                    const next = new Set(prev);
                    next.delete(postId);
                    return next;
                });
                await postService.unlikePost(postId);
            } else {
                setLikedPosts(prev => new Set(prev).add(postId));
                await postService.likePost(postId);
                rewardService.updateTaskProgress('like_posts', 1).catch(console.error);
            }
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const toggleFollow = async (targetUserId: string) => {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser || currentUser.uid === targetUserId) return;

        const isFollowing = followingIds.has(targetUserId);
        try {
            if (isFollowing) {
                setFollowingIds(prev => {
                    const next = new Set(prev);
                    next.delete(targetUserId);
                    return next;
                });
                await userService.unfollowUser(currentUser.uid, targetUserId);
            } else {
                setFollowingIds(prev => new Set(prev).add(targetUserId));
                await userService.followUser(currentUser.uid, targetUserId);
            }
        } catch (error) {
            console.error('Follow error:', error);
        }
    };

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length > 2) {
            const results = await userService.searchUsers(text);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const handleShare = async (post: Post) => {
        try {
            await shareContent(
                `Video by ${post.username}`,
                `Check out this video on Striver!`,
                'post',
                post.id
            );
            await postService.sharePost(post.id);
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const renderItem = ({ item, index }: { item: Post; index: number }) => {
        const isPaused = !isFocused || visibleItemIndex !== index;
        const isLiked = likedPosts.has(item.id);

        return (
            <View style={styles.postContainer}>
                <Video
                    source={{ uri: item.videoUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    repeat
                    paused={isPaused}
                    muted={false}
                />

                {/* Overlay Constants */}
                <View style={styles.overlay}>
                    <View style={styles.rightActions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item.id)}>
                            <Heart
                                color={isLiked ? COLORS.primary : COLORS.white}
                                fill={isLiked ? COLORS.primary : 'transparent'}
                                size={32}
                            />
                            <Text style={styles.actionText}>{item.likes}</Text>
                        </TouchableOpacity>

                        {!isChildMode && (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Comments', { postId: item.id })}>
                                <MessageCircle color={COLORS.white} size={32} />
                                <Text style={styles.actionText}>{item.comments}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
                            <Share2 color={COLORS.white} size={32} />
                            <Text style={styles.actionText}>{item.shares || 'Share'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomInfo}>
                        <View style={styles.userInfo}>
                            <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.userId })}>
                                <Image
                                    source={{ uri: item.userAvatar || 'https://ui-avatars.com/api/?name=' + item.username }}
                                    style={styles.avatar}
                                />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <View style={styles.usernameRow}>
                                    <Text style={styles.username}>@{item.username}</Text>
                                    {firebaseAuth.currentUser?.uid !== item.userId && (
                                        <TouchableOpacity
                                            style={[styles.followBtn, followingIds.has(item.userId) && styles.followingBtn]}
                                            onPress={() => toggleFollow(item.userId)}
                                        >
                                            {followingIds.has(item.userId) ? (
                                                <UserCheck color={COLORS.white} size={16} />
                                            ) : (
                                                <UserPlus color={COLORS.primary} size={16} />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Top Navigation */}
            <View style={[styles.topNav, { top: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Profile')}
                    style={styles.logoBox}
                >
                    <Image
                        source={require('../../../assets/images/icon.png')}
                        style={{ width: 24, height: 24, resizeMode: 'contain' }}
                    />
                </TouchableOpacity>
                {!isChildMode ? (
                    <View style={styles.tabs}>
                        <TouchableOpacity onPress={() => setActiveTab('Following')}>
                            <Text style={[styles.tabText, activeTab === 'Following' && styles.tabActive]}>Following</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActiveTab('For You')}>
                            <Text style={[styles.tabText, activeTab === 'For You' && styles.tabActive]}>For You</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.juniorBadge}
                        onPress={async () => {
                            const currentUser = firebaseAuth.currentUser;
                            if (currentUser) {
                                await userService.switchActiveProfile(currentUser.uid, null);
                            }
                        }}
                    >
                        <ShieldCheck color={COLORS.primary} size={14} />
                        <Text style={styles.juniorBadgeText}>JUNIOR BALLER SAFE ZONE</Text>
                        <View style={styles.parentSwitchHint}>
                            <Text style={styles.parentSwitchHintText}>Parent</Text>
                        </View>
                    </TouchableOpacity>
                )}
                <View style={styles.topActions}>
                    {!isChildMode && (
                        <TouchableOpacity onPress={() => setShowSearch(true)}>
                            <Search color={COLORS.white} size={24} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity>
                        <View style={styles.coinPill}>
                            <Coins color={COLORS.primary} size={14} />
                            <Text style={styles.coinPillText}>{userCoins}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={posts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={WINDOW_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.white} />
                }
            />

            {/* Search Overlay */}
            <Modal visible={showSearch} animationType="fade" transparent>
                <SafeAreaView style={styles.searchOverlay}>
                    <View style={styles.searchHeader}>
                        <View style={styles.searchInputContainer}>
                            <Search color={COLORS.textSecondary} size={20} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search ballers..."
                                placeholderTextColor={COLORS.textSecondary}
                                value={searchQuery}
                                onChangeText={handleSearch}
                                autoFocus
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <X color={COLORS.textSecondary} size={20} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => setShowSearch(false)} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.uid}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.searchResultItem}
                                onPress={() => {
                                    setShowSearch(false);
                                    navigation.navigate('Profile', { userId: item.uid });
                                }}
                            >
                                <Image source={{ uri: item.avatar || 'https://via.placeholder.com/100' }} style={styles.searchAvatar} />
                                <View>
                                    <Text style={styles.searchUsername}>@{item.username}</Text>
                                    <Text style={styles.searchDisplayName}>{item.displayName || 'Striver'}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            searchQuery.length > 2 ? (
                                <View style={styles.emptySearch}>
                                    <Text style={styles.emptySearchText}>No users found for "{searchQuery}"</Text>
                                </View>
                            ) : null
                        }
                    />
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    postContainer: {
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: SPACING.md,
        paddingBottom: 100, // Account for tab bar
    },
    rightActions: {
        position: 'absolute',
        right: SPACING.md,
        bottom: 120,
        gap: SPACING.lg,
        alignItems: 'center',
    },
    actionBtn: {
        alignItems: 'center',
    },
    actionText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    bottomInfo: {
        width: '80%',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    username: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    caption: {
        color: COLORS.white,
        fontSize: 14,
        marginTop: 4,
    },
    topNav: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        zIndex: 10,
    },
    logoBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabs: {
        flexDirection: 'row',
        gap: SPACING.lg,
    },
    tabText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        fontWeight: '700',
    },
    tabActive: {
        color: COLORS.white,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.white,
    },
    topActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    coinPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 15,
        gap: 4,
    },
    coinPillText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '800',
    },
    juniorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.2)',
    },
    juniorBadgeText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    parentSwitchHint: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 4,
    },
    parentSwitchHintText: {
        color: COLORS.background,
        fontSize: 8,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    usernameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    followBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    followingBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.3)',
    },
    searchOverlay: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        gap: SPACING.md,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        paddingHorizontal: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: COLORS.white,
    },
    cancelBtn: {
        paddingHorizontal: 4,
    },
    cancelText: {
        color: COLORS.white,
        fontWeight: '600',
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        gap: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    searchAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    searchUsername: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    searchDisplayName: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    emptySearch: {
        padding: 40,
        alignItems: 'center',
    },
    emptySearchText: {
        color: COLORS.textSecondary,
        textAlign: 'center',
    }
});

export default HomeFeedScreen;
