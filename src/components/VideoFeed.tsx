import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, Dimensions, View, ActivityIndicator, ViewToken } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import FeedItem from './FeedItem';
import postService, { Post } from '../api/postService';
import userService from '../api/userService';
import rewardService from '../api/rewardService';
import { firebaseAuth } from '../api/firebase';
import { shareContent } from '../utils/deepLink';
import { COLORS } from '../constants/theme';

const { height } = Dimensions.get('window');

interface VideoFeedProps {
    posts: Post[];
    initialScrollIndex?: number;
    onRefresh?: () => void;
    refreshing?: boolean;
    onEndReached?: () => void;
    isChildMode?: boolean;
    ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

const VideoFeed = ({
    posts,
    initialScrollIndex = 0,
    onRefresh,
    refreshing = false,
    onEndReached,
    isChildMode = false,
    ListEmptyComponent
}: VideoFeedProps) => {
    const isFocused = useIsFocused();
    const navigation = useNavigation<any>();
    const [visibleItemIndex, setVisibleItemIndex] = useState(initialScrollIndex);
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [localPosts, setLocalPosts] = useState<Post[]>(posts);

    const flatListRef = useRef<FlatList>(null);

    // Update local posts when props change
    useEffect(() => {
        setLocalPosts(posts);
    }, [posts]);

    // Initialize local state from props
    useEffect(() => {
        checkInteractions();
        
        // Set up real-time listener for post updates
        const unsubscribers: (() => void)[] = [];
        
        localPosts.forEach(post => {
            const unsubscribe = postService.subscribeToPostUpdates(post.id, (updatedPost) => {
                if (updatedPost) {
                    setLocalPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
                }
            });
            if (unsubscribe) unsubscribers.push(unsubscribe);
        });
        
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [localPosts.length]); // Only re-subscribe when number of posts changes

    const checkInteractions = async () => {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser || localPosts.length === 0) return;

        // Check which posts the user has liked
        const likedPostIds = new Set<string>();
        const followingUserIds = new Set<string>();
        
        // Check likes and follows in parallel
        await Promise.all(localPosts.map(async (post) => {
            const [isLiked, isFollowing] = await Promise.all([
                postService.hasLikedPost(post.id),
                post.userId !== currentUser.uid ? userService.isFollowing(currentUser.uid, post.userId) : Promise.resolve(false)
            ]);
            
            if (isLiked) likedPostIds.add(post.id);
            if (isFollowing) followingUserIds.add(post.userId);
        }));
        
        setLikedPosts(likedPostIds);
        setFollowingIds(followingUserIds);
    };

    const handleLike = async (postId: string) => {
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

    const handleFollow = async (targetUserId: string) => {
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
                // Milestone trigger handled in userService
            }
        } catch (error) {
            console.error('Follow error:', error);
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

    const handleComment = (postId: string) => {
        navigation.navigate('Comments', { postId });
    };

    const handleProfile = (userId: string) => {
        navigation.navigate('Profile', { userId });
    };

    const viewTimerRef = useRef<NodeJS.Timeout | null>(null);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            const index = viewableItems[0].index;
            setVisibleItemIndex(index);

            // Clear existing timer
            if (viewTimerRef.current) {
                clearTimeout(viewTimerRef.current);
            }

            // Start new timer to debounce view counting (2 seconds)
            viewTimerRef.current = setTimeout(() => {
                const post = viewableItems[0].item as Post;
                if (post) {
                    // Only count if user actually watches for a bit
                    rewardService.updateTaskProgress('watch_5_videos', 1).catch(console.error);
                    postService.incrementViews(post.id).catch(console.error);
                }
            }, 2000);
        }
    }).current;

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (viewTimerRef.current) {
                clearTimeout(viewTimerRef.current);
            }
        };
    }, []);

    const renderItem = ({ item, index }: { item: Post, index: number }) => (
        <FeedItem
            item={item}
            isVisible={index === visibleItemIndex}
            isFocused={isFocused}
            onLike={handleLike}
            onShare={handleShare}
            onComment={handleComment}
            onFollow={handleFollow}
            onProfilePress={handleProfile}
            isLiked={likedPosts.has(item.id)}
            isFollowing={followingIds.has(item.userId)}
            isChildMode={isChildMode}
        />
    );

    return (
        <FlatList
            ref={flatListRef}
            data={localPosts}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={height}
            snapToAlignment="start"
            decelerationRate="fast"
            viewabilityConfig={{
                itemVisiblePercentThreshold: 50
            }}
            onViewableItemsChanged={onViewableItemsChanged}
            initialScrollIndex={initialScrollIndex}
            onScrollToIndexFailed={info => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                    flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                });
            }}
            getItemLayout={(data, index) => (
                { length: height, offset: height * index, index }
            )}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={ListEmptyComponent}
            style={styles.list}
            removeClippedSubviews={true} // Critical for memory
            windowSize={3} // Optimize memory usage
            initialNumToRender={1} // Speed up initial load
            maxToRenderPerBatch={1} // Reduce JS thread blocking
        />
    );
};

const styles = StyleSheet.create({
    list: {
        flex: 1,
        backgroundColor: COLORS.background,
    }
});

export default VideoFeed;
