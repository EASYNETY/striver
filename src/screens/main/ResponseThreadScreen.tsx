import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, StatusBar, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { ChevronLeft, Plus, Trophy } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import postService, { Post } from '../../api/postService';
import userService from '../../api/userService';
import { firebaseAuth } from '../../api/firebase';
import { COLORS, SPACING } from '../../constants/theme';
import { shareContent } from '../../utils/deepLink';
import ResponseItem from '../../components/ResponseItem';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

const ResponseThreadScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);

    const { postId, level = 0 } = route.params || {};

    const [originalPost, setOriginalPost] = useState<Post | null>(null);
    const [responses, setResponses] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleItemIndex, setVisibleItemIndex] = useState(0);
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, [postId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Fetch original post
            const post = await postService.getPostById(postId);
            if (post && !post.username) {
                try {
                    const prof = await userService.getUserProfile(post.userId);
                    if (prof) {
                        post.username = prof.username || 'User';
                        post.userAvatar = prof.avatar || '';
                    }
                } catch (err) {
                    console.warn('[ResponseThread] Profile fetch failed:', err);
                    post.username = 'User';
                }
            }
            setOriginalPost(post);

            // 2. Fetch responses
            const responsePosts = await postService.getResponsesForPost(postId);

            // 3. Sanitize responses (ensure usernames exist)
            const sanitizedResponses = await Promise.all(responsePosts.map(async (p) => {
                if (!p.username) {
                    try {
                        const prof = await userService.getUserProfile(p.userId);
                        return { ...p, username: prof?.username || 'User', userAvatar: prof?.avatar || '' };
                    } catch {
                        return { ...p, username: 'User' };
                    }
                }
                return p;
            }));

            setResponses(sanitizedResponses);

            // 4. Fetch user context (likes/following)
            const currentUser = firebaseAuth.currentUser;
            if (currentUser) {
                const liked = await postService.getUserLikedPosts(currentUser.uid);
                setLikedPosts(new Set(liked));

                // For following, we just initialize the set. 
                // In a real app we'd fetch the user's following list too.
            }
        } catch (error) {
            console.error('Error loading response thread:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleLike = useCallback(async (postId: string) => {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return;

        const isLiked = likedPosts.has(postId);
        setLikedPosts(prev => {
            const next = new Set(prev);
            if (isLiked) next.delete(postId);
            else next.add(postId);
            return next;
        });

        setResponses(currentPosts =>
            currentPosts.map(p =>
                p.id === postId
                    ? { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 }
                    : p
            )
        );

        try {
            if (isLiked) await postService.unlikePost(postId);
            else await postService.likePost(postId);
        } catch (error) {
            console.error('Like error:', error);
        }
    }, [likedPosts]);

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

    const handleShare = useCallback(async (post: Post) => {
        try {
            await shareContent(`Video by ${post.username}`, `Check out this response on Striver!`, 'post', post.id);
            await postService.sharePost(post.id);
        } catch (error) {
            console.error('Share error:', error);
        }
    }, []);

    const navigateToNextLevel = useCallback((responsePostId: string) => {
        navigation.push('ResponseThread', { postId: responsePostId, level: level + 1 });
    }, [navigation, level]);

    const scrollToNext = useCallback((index: number) => {
        if (index >= 0 && index < responses.length && flatListRef.current) {
            flatListRef.current.scrollToIndex({ index, animated: true });
        }
    }, [responses.length]);

    const renderResponseItem = useCallback(({ item, index }: { item: Post; index: number }) => (
        <ResponseItem
            item={item}
            index={index}
            isFocused={isFocused}
            visibleItemIndex={visibleItemIndex}
            level={level}
            likedPosts={likedPosts}
            followingIds={followingIds}
            navigation={navigation}
            toggleLike={toggleLike}
            toggleFollow={toggleFollow}
            handleShare={handleShare}
            navigateToNextLevel={navigateToNextLevel}
            scrollToNext={scrollToNext}
        />
    ), [isFocused, visibleItemIndex, level, likedPosts, followingIds, navigation, toggleLike, toggleFollow, handleShare, navigateToNextLevel, scrollToNext]);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setVisibleItemIndex(viewableItems[0].index || 0);
        }
    }).current;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                <View style={[styles.topNav, { top: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft color={COLORS.white} size={24} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        Responses {originalPost ? `to @${originalPost.username}` : ''}
                    </Text>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Upload', { responseTo: postId, isResponse: true })}
                        style={styles.backBtn}
                    >
                        <Plus color={COLORS.primary} size={24} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Updating thread...</Text>
                    </View>
                ) : responses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Trophy color={COLORS.surface} size={64} />
                        <Text style={styles.emptyText}>No responses yet.</Text>
                        <Text style={[styles.emptyText, { fontSize: 14, marginTop: 10 }]}>Be the first to respond!</Text>
                        <TouchableOpacity
                            style={[styles.responseBtn, { marginTop: 20 }]}
                            onPress={() => navigation.navigate('Upload', { responseTo: postId, isResponse: true })}
                        >
                            <Plus color={COLORS.background} size={24} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={responses}
                        renderItem={renderResponseItem}
                        keyExtractor={(item) => item.id}
                        pagingEnabled
                        showsVerticalScrollIndicator={false}
                        snapToInterval={WINDOW_HEIGHT}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
                        initialNumToRender={1}
                        maxToRenderPerBatch={2}
                        windowSize={3}
                        removeClippedSubviews={Platform.OS === 'android'}
                        getItemLayout={(_, index) => ({
                            length: WINDOW_HEIGHT,
                            offset: WINDOW_HEIGHT * index,
                            index,
                        })}
                    />
                )}
            </View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
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
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { color: COLORS.textSecondary, fontSize: 16, marginTop: 20, textAlign: 'center' },
    responseBtn: {
        backgroundColor: COLORS.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ResponseThreadScreen;
