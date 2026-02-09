import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, Dimensions, StatusBar, Text, TouchableOpacity, Image, Share, RefreshControl, Modal, SafeAreaView, TextInput, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HLSVideoPlayer from '../../components/HLSVideoPlayer';
import { COLORS, SPACING } from '../../constants/theme';
import { Heart, MessageCircle, Share2, Search, Bell, Coins, ShieldCheck, X, UserPlus, UserCheck, Trophy, Camera, Home, MessageSquare, Plus, Star, ChevronUp } from 'lucide-react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import postService, { Post } from '../../api/postService';
import userService, { UserProfile } from '../../api/userService';
import { RewardService } from '../../api/rewardService';
import { firebaseAuth } from '../../api/firebase';
import { shareContent } from '../../utils/deepLink';
import { CAREER_TIERS, EARNING_RULES } from '../../constants/rewards';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

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
        right: 8, // Closer to edge
        bottom: 120,
        gap: SPACING.md, // Reduced gap
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
        gap: 6,
    },
    inlineTierBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
    },
    followBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    followingBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.3)',
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
    },
    striverCard: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        marginBottom: 8,
    },
    striverTierText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    responseBtn: {
        backgroundColor: COLORS.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5, // Improved alignment
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 6,
    },
    tagText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    swipeHint: {
        position: 'absolute',
        bottom: 140,
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        zIndex: 5,
    },
    swipeHintText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: '600',
    },
    rejectedContainer: {
        flex: 1,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    rejectedTitle: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
    },
    rejectedDesc: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
    },
    legendBadgeSmall: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#000',
    },
    challengeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        marginTop: 12,
        gap: 8,
        alignSelf: 'flex-start',
    },
    challengeBtnText: {
        color: COLORS.background,
        fontSize: 14,
        fontWeight: '900',
    },
    searchOverlay: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    threadModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        marginTop: 100,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 10,
    },
    threadHeader: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    threadHandle: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        marginBottom: 15,
    },
    threadTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    threadTitle: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: 'bold',
    },
    storiesContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 1,
    },
    storyCircle: {
        marginRight: 15,
        alignItems: 'center',
    },
    storyBorder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: COLORS.primary,
        padding: 2,
    },
    storyAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
    },
    storyUser: {
        color: COLORS.white,
        fontSize: 10,
        marginTop: 4,
    },
    threadControls: {
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    autoScrollBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    autoScrollText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    threadItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    threadItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    threadAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    threadUsername: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
    threadVideoPlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: '#111',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    threadComment: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    placeholderText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 8,
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

interface PostItemProps {
    item: Post;
    index: number;
    isFocused: boolean;
    visibleItemIndex: number;
    likedPosts: Set<string>;
    isChildMode: boolean;
    navigation: any;
    handleShare: (post: Post) => void;
    toggleLike: (postId: string) => void;
    followingIds: Set<string>;
    toggleFollow: (targetUserId: string) => void;
    onRelevancyChange: (postId: string, relevant: boolean) => void;
    onExpandThreads: (postId: string) => void;
    scrollToIndex: (index: number) => void;
}

// Sub-component for the Video Progress Bar
const VideoProgressBar = ({ progress }: { progress: number }) => (
    <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
    </View>
);

// Memoized Post component to prevent unnecessary re-renders
const MemoizedPostItem = React.memo(({ item, index, isFocused, visibleItemIndex, likedPosts, isChildMode, navigation, handleShare, toggleLike, followingIds, toggleFollow, onRelevancyChange, onExpandThreads, scrollToIndex }: PostItemProps) => {
    const isPaused = !isFocused || visibleItemIndex !== index;
    const isLiked = likedPosts.has(item.id);
    const [progress, setProgress] = useState(0);
    const isFollowing = followingIds.has(item.userId);
    const isCurrentUser = firebaseAuth.currentUser?.uid === item.userId;

    // Create stable callback references for runOnJS
    const handleExpandThreads = useCallback(() => {
        onExpandThreads(item.id);
    }, [item.id, onExpandThreads]);

    const handleScrollToNext = useCallback(() => {
        scrollToIndex(index + 1);
    }, [index, scrollToIndex]);

    const handleNavigateToUpload = useCallback(() => {
        navigation.navigate('Upload', { 
            responseTo: item.id,
            isResponse: true
        });
    }, [item.id, navigation]);

    const handleRelevancyAlert = useCallback(() => {
        Alert.alert(
            'Content Relevancy',
            'Is this content relevant to you?',
            [
                { text: 'Relevant', onPress: () => onRelevancyChange(item.id, true) },
                { text: 'Not Relevant', onPress: () => onRelevancyChange(item.id, false) },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    }, [item.id, onRelevancyChange]);

    // Gesture Handling for this specific video item
    const swipeUpGesture = Gesture.Pan()
        .activeOffsetY(-50)
        .failOffsetX([-50, 50])
        .onEnd((e) => {
            'worklet';
            if (e.velocityY < -500) { // Swipe up detected
                runOnJS(handleExpandThreads)();
            }
        });

    const swipeLeftGesture = Gesture.Pan()
        .activeOffsetX(-50)
        .failOffsetY([-50, 50])
        .onEnd((e) => {
            'worklet';
            if (e.velocityX < -500) { // Swipe left detected
                runOnJS(handleScrollToNext)();
            }
        });

    const swipeRightGesture = Gesture.Pan()
        .activeOffsetX(50)
        .failOffsetY([-50, 50])
        .onEnd((e) => {
            'worklet';
            if (e.velocityX > 500) { // Swipe right detected
                runOnJS(handleNavigateToUpload)();
            }
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(800)
        .onEnd((e, success) => {
            'worklet';
            if (success) {
                runOnJS(handleRelevancyAlert)();
            }
        });

    const composedGesture = Gesture.Simultaneous(swipeUpGesture, swipeLeftGesture, swipeRightGesture, longPressGesture);

    return (
        <GestureDetector gesture={composedGesture}>
            <View style={styles.postContainer}>
                {item.status === 'rejected' ? (
                    <View style={styles.rejectedContainer}>
                        <Image source={{ uri: item.videoUrl }} style={[StyleSheet.absoluteFill, { opacity: 0.3 }]} blurRadius={10} />
                        <ShieldCheck color={COLORS.error} size={48} />
                        <Text style={styles.rejectedTitle}>Video Unavailable</Text>
                        <Text style={styles.rejectedDesc}>This content does not meet our community guidelines.</Text>
                    </View>
                ) : (
                    <HLSVideoPlayer
                        videoUrl={item.videoUrl}
                        thumbnail={item.thumbnailUrl}
                        paused={isPaused}
                        onProgress={(data) => {
                            if (data.playableDuration > 0) {
                                setProgress((data.currentTime / data.playableDuration) * 100);
                            }
                        }}
                    />
                )}

                {/* Engagement Overlay */}
                <View style={styles.overlay}>
                    {/* Swipe Up Hint */}
                    <View style={styles.swipeHint}>
                        <ChevronUp color={COLORS.white} size={16} />
                        <Text style={styles.swipeHintText}>Swipe up for responses</Text>
                    </View>

                    <View style={styles.rightActions}>
                        {/* Striver Level Badge (Icon Only per user request) */}
                        <TouchableOpacity
                            style={styles.striverCard}
                            onPress={() => navigation.navigate('Rewards')}
                        >
                            <Trophy color={COLORS.primary} size={24} />
                        </TouchableOpacity>

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
                                <MessageSquare color={COLORS.white} size={32} />
                                <Text style={styles.actionText}>{item.comments}</Text>
                            </TouchableOpacity>
                        )}

                        {!isChildMode && (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
                                <Share2 color={COLORS.white} size={32} />
                                <Text style={styles.actionText}>{item.shares || 'Share'}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.responseBtn]}
                            onPress={() => navigation.navigate('Upload', { 
                                responseTo: item.id,
                                isResponse: true  // Flag to track this is a response
                            })}
                        >
                            <Plus color={COLORS.background} size={28} strokeWidth={3} />
                        </TouchableOpacity>
                        <Text style={[styles.actionText, { marginTop: 2 }]}>Respond</Text>
                    </View>

                    <View style={styles.bottomInfo}>
                        <View style={styles.userInfo}>
                            <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.userId })}>
                                <Image
                                    source={{ uri: item.userAvatar || 'https://ui-avatars.com/api/?name=' + item.username }}
                                    style={styles.avatar}
                                />
                                {item.isLegend && (
                                    <View style={styles.legendBadgeSmall}>
                                        <Trophy color={COLORS.white} size={8} />
                                    </View>
                                )}
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <View style={styles.usernameRow}>
                                    <Text style={styles.username}>@{item.username}</Text>
                                    {item.isLegend && <ShieldCheck color={COLORS.primary} size={14} />}
                                    {item.career_tier_id && (
                                        <View style={[styles.inlineTierBadge, { backgroundColor: CAREER_TIERS.find(t => t.id === item.career_tier_id)?.color || COLORS.primary }]}>
                                            <Trophy color={COLORS.background} size={8} />
                                        </View>
                                    )}
                                    {!isCurrentUser && (
                                        <TouchableOpacity
                                            style={[styles.followBtn, isFollowing && styles.followingBtn]}
                                            onPress={() => toggleFollow(item.userId)}
                                        >
                                            {isFollowing ? (
                                                <UserCheck color={COLORS.primary} size={16} />
                                            ) : (
                                                <UserPlus color={COLORS.primary} size={16} />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
                                <View style={styles.tagRow}>
                                    {item.hashtags?.map(tag => (
                                        <Text key={tag} style={styles.tagText}>#{tag}</Text>
                                    ))}
                                </View>
                            </View>
                        </View>
                        {item.squadId && (
                            <TouchableOpacity
                                style={styles.challengeBtn}
                                onPress={() => {
                                    // Navigate to upload screen with challenge context
                                    navigation.navigate('Upload', { 
                                        challengeId: item.squadId,
                                        challengePostId: item.id 
                                    });
                                }}
                            >
                                <Star color={COLORS.background} size={18} fill={COLORS.background} />
                                <Text style={styles.challengeBtnText}>JOIN CHALLENGE</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <VideoProgressBar progress={progress} />
                </View>
            </View>
        </GestureDetector>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.index === nextProps.index &&
        prevProps.isFocused === nextProps.isFocused &&
        prevProps.visibleItemIndex === nextProps.visibleItemIndex &&
        prevProps.likedPosts.has(prevProps.item.id) === nextProps.likedPosts.has(nextProps.item.id) &&
        prevProps.followingIds.has(prevProps.item.userId) === nextProps.followingIds.has(nextProps.item.userId) &&
        prevProps.isChildMode === nextProps.isChildMode &&
        prevProps.item.likes === nextProps.item.likes &&
        prevProps.item.comments === nextProps.item.comments
    );
});

const HomeFeedScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const [activeTab, setActiveTab] = useState<'For You' | 'Following'>('For You');
    const [posts, setPosts] = useState<Post[]>([]);
    const [userCoins, setUserCoins] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isChildMode, setIsChildMode] = useState(false);
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [visibleItemIndex, setVisibleItemIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Filter feed based on onboarding interests if needed
    useEffect(() => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
            userService.getUserProfile(currentUser.uid).then(profile => {
                setUserProfile(profile);
            });
        }
    }, []);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80
    }).current;

    const lastTrackedIndex = useRef(-1);
    const awardCoinsDebounceTimer = useRef<NodeJS.Timeout | null>(null);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index;
            if (index !== visibleItemIndex) {
                setVisibleItemIndex(index);

                // Track video view for rewards - only if it's a new video
                if (index !== lastTrackedIndex.current) {
                    lastTrackedIndex.current = index;
                    const currentPostId = posts[index]?.id;
                    
                    if (currentPostId && firebaseAuth.currentUser) {
                        // Debounce coin awarding to prevent bridge congestion
                        if (awardCoinsDebounceTimer.current) {
                            clearTimeout(awardCoinsDebounceTimer.current);
                        }
                        awardCoinsDebounceTimer.current = setTimeout(async () => {
                            try {
                                await RewardService.trackActivity(
                                    firebaseAuth.currentUser?.uid || '', 
                                    'watch_video', 
                                    { postId: currentPostId }
                                );
                                console.log('[HomeFeedScreen] Video watch tracked for rewards');
                            } catch (error) {
                                console.error('[HomeFeedScreen] Failed to track video watch:', error);
                            }
                        }, 1000); // Award coins after 1 second of stable view
                    }
                }
            }
        }
    }).current;

    useEffect(() => {
        // Track daily login
        RewardService.trackActivity(firebaseAuth.currentUser?.uid || '', 'daily_login').catch(console.error);
    }, []);

    useEffect(() => {
        let unsubscribe: () => void;
        const limitByInterests = userProfile?.interests || [];

        if (activeTab === 'For You') {
            unsubscribe = postService.subscribeToFeedPosts((updatedPosts) => {
                console.log('[HomeFeedScreen] Feed posts received:', updatedPosts.length);
                if (updatedPosts.length === 0) {
                    console.warn('[HomeFeedScreen] No posts found - check Firestore for posts with status="active"');
                }
                // Initial personalization logic: prefer posts matching interests
                const filtered = updatedPosts.sort((a, b) => {
                    const aMatches = a.hashtags?.some(h => limitByInterests.includes(h)) ? 1 : 0;
                    const bMatches = b.hashtags?.some(h => limitByInterests.includes(h)) ? 1 : 0;
                    return bMatches - aMatches;
                });
                setPosts(filtered);
                setLoading(false);
                setRefreshing(false);
            });
        } else {
            unsubscribe = postService.subscribeToFollowingFeed((updatedPosts) => {
                console.log('[HomeFeedScreen] Following feed posts received:', updatedPosts.length);
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
    }, [activeTab, userProfile]);

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

    const toggleLike = useCallback(async (postId: string) => {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return;

        const isLiked = likedPosts.has(postId);

        // Optimistic UI update
        setLikedPosts(prev => {
            const next = new Set(prev);
            if (isLiked) next.delete(postId);
            else next.add(postId);
            return next;
        });

        // Optimistically update the post's local like count
        setPosts(currentPosts =>
            currentPosts.map(p =>
                p.id === postId
                    ? { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 }
                    : p
            )
        );

        try {
            if (isLiked) {
                await postService.unlikePost(postId);
            } else {
                await postService.likePost(postId);
                RewardService.awardCoins(currentUser.uid, 'like_posts').catch(console.error);
            }
        } catch (error) {
            console.error('Like error:', error);
            // Rollback on error? In real app yes, here we keep it simple
        }
    }, [likedPosts, posts]);

    const toggleFollow = useCallback(async (targetUserId: string) => {
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
    }, [followingIds]);

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length > 2) {
            const results = await userService.searchUsers(text);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const handleShare = useCallback(async (post: Post) => {
        try {
            await shareContent(
                `Video by ${post.username} `,
                `Check out this video on Striver!`,
                'post',
                post.id
            );
            await postService.sharePost(post.id);
        } catch (error) {
            console.error('Share error:', error);
        }
    }, []);

    const [showThreads, setShowThreads] = useState(false);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

    const handleRelevancy = (postId: string, relevant: boolean) => {
        Alert.alert('Thank you!', `Feed will be updated to show ${relevant ? 'more' : 'less'} content like this.`);
    };

    const handleThreads = (postId: string) => {
        setCurrentThreadId(postId);
        setShowThreads(true);
    };

    const scrollToIndex = useCallback((targetIndex: number) => {
        if (targetIndex >= 0 && targetIndex < posts.length && flatListRef.current) {
            flatListRef.current.scrollToIndex({ index: targetIndex, animated: true });
        }
    }, [posts.length]);

    const renderItem = useCallback(({ item, index }: { item: Post; index: number }) => (
        <MemoizedPostItem
            item={item}
            index={index}
            isFocused={isFocused}
            visibleItemIndex={visibleItemIndex}
            likedPosts={likedPosts}
            isChildMode={isChildMode}
            navigation={navigation}
            handleShare={handleShare}
            toggleLike={toggleLike}
            followingIds={followingIds}
            toggleFollow={toggleFollow}
            onRelevancyChange={handleRelevancy}
            onExpandThreads={handleThreads}
            scrollToIndex={scrollToIndex}
        />
    ), [isFocused, visibleItemIndex, likedPosts, isChildMode, navigation, handleShare, toggleLike, followingIds, toggleFollow, scrollToIndex]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                {/* Top Navigation */}
                <View style={[styles.topNav, { top: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Upload')}
                        style={styles.logoBox}
                    >
                        <Camera color={COLORS.primary} size={24} />
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
                        </TouchableOpacity>
                    )}

                    <View style={styles.topActions}>
                        <TouchableOpacity
                            style={styles.coinPill}
                            onPress={() => navigation.navigate('Rewards')}
                        >
                            <Coins color={COLORS.primary} size={16} />
                            <Text style={styles.coinPillText}>{userCoins}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowSearch(true)}>
                            <Search color={COLORS.white} size={24} />
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
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
                    initialNumToRender={1}
                    maxToRenderPerBatch={2}
                    windowSize={3}
                    removeClippedSubviews={Platform.OS === 'android'}
                    getItemLayout={(data, index) => ({
                        length: WINDOW_HEIGHT,
                        offset: WINDOW_HEIGHT * index,
                        index: index ?? 0,
                    })}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.white} />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={[styles.postContainer, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
                                <Home color={COLORS.textSecondary} size={64} />
                                <Text style={[styles.username, { marginTop: 20, textAlign: 'center' }]}>
                                    {activeTab === 'Following' ? 'No videos from people you follow' : 'No videos yet'}
                                </Text>
                                <Text style={[styles.caption, { textAlign: 'center', marginTop: 8 }]}>
                                    {activeTab === 'Following' 
                                        ? 'Follow some ballers to see their content here!' 
                                        : 'Be the first to post a video!'}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.challengeBtn, { marginTop: 20 }]}
                                    onPress={() => navigation.navigate('Upload')}
                                >
                                    <Camera color={COLORS.background} size={20} />
                                    <Text style={styles.challengeBtnText}>CREATE VIDEO</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null
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

                {/* Response Thread Modal (Hero Thread / Specialized Feed) */}
                <Modal visible={showThreads} animationType="slide" transparent>
                    <View style={styles.threadModalContainer}>
                        <View style={styles.threadHeader}>
                            <View style={styles.threadHandle} />
                            <View style={styles.threadTitleRow}>
                                <Text style={styles.threadTitle}>Response Feed</Text>
                                <TouchableOpacity onPress={() => setShowThreads(false)}>
                                    <X color={COLORS.white} size={24} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Top Responses FlatList - Now Dynamic based on currentThreadId responses */}
                        <View style={styles.storiesContainer}>
                            <Text style={styles.sectionLabel}>Top Ballers Responding</Text>
                            <FlatList
                                horizontal
                                data={posts.filter(p => p.responseTo === currentThreadId)}
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(i) => i.id}
                                ListEmptyComponent={
                                    <View style={{ padding: 10 }}>
                                        <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Be the first to respond!</Text>
                                    </View>
                                }
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.storyCircle}
                                        onPress={() => {
                                            setShowThreads(false);
                                            // Navigation to the specific post or user
                                            navigation.navigate('Profile', { userId: item.userId });
                                        }}
                                    >
                                        <View style={styles.storyBorder}>
                                            <Image source={{ uri: item.userAvatar || 'https://via.placeholder.com/60' }} style={styles.storyAvatar} />
                                        </View>
                                        <Text style={styles.storyUser}>@{item.username}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        <View style={styles.threadControls}>
                            <TouchableOpacity style={styles.autoScrollBtn}>
                                <Text style={styles.autoScrollText}>Thread Auto-Scroll ON</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={posts.filter(p => p.responseTo === currentThreadId)}
                            keyExtractor={(item) => item.id}
                            ListEmptyComponent={
                                <View style={styles.emptySearch}>
                                    <Trophy color={COLORS.surface} size={48} />
                                    <Text style={styles.emptySearchText}>No response videos yet.</Text>
                                    <TouchableOpacity
                                        style={[styles.challengeBtn, { alignSelf: 'center', marginTop: 20 }]}
                                        onPress={() => {
                                            setShowThreads(false);
                                            navigation.navigate('Upload', { responseTo: currentThreadId });
                                        }}
                                    >
                                        <Plus color={COLORS.background} size={20} />
                                        <Text style={styles.challengeBtnText}>Post a Response</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.threadItem}
                                    onPress={() => {
                                        setShowThreads(false);
                                        // Scroll to post in main feed or navigate
                                    }}
                                >
                                    <View style={styles.threadItemHeader}>
                                        <Image source={{ uri: item.userAvatar || 'https://via.placeholder.com/40' }} style={styles.threadAvatar} />
                                        <Text style={styles.threadUsername}>@{item.username}</Text>
                                        {item.career_tier_id && (
                                            <View style={[styles.inlineTierBadge, { backgroundColor: CAREER_TIERS.find(t => t.id === item.career_tier_id)?.color || COLORS.primary }]}>
                                                <Trophy color={COLORS.background} size={8} />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.threadVideoPlaceholder}>
                                        <Image source={{ uri: item.thumbnailUrl }} style={[StyleSheet.absoluteFill, { borderRadius: 15 }]} />
                                        <Text style={styles.placeholderText}>Tap to play response</Text>
                                    </View>
                                    <Text style={styles.threadComment}>{item.caption}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </Modal>
            </View>
        </GestureHandlerRootView>
    );
};

export default HomeFeedScreen;
