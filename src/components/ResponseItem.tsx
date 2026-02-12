import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text, Dimensions } from 'react-native';
import { Heart, MessageCircle, Share2, UserCheck, UserPlus, Trophy, Camera } from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import HLSVideoPlayer from './HLSVideoPlayer';
import { COLORS, SPACING } from '../constants/theme';
import { CAREER_TIERS } from '../constants/rewards';
import { firebaseAuth } from '../api/firebase';
import { Post } from '../api/postService';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

interface ResponseItemProps {
    item: Post;
    index: number;
    isFocused: boolean;
    visibleItemIndex: number;
    level: number;
    likedPosts: Set<string>;
    followingIds: Set<string>;
    navigation: any;
    toggleLike: (postId: string) => void;
    toggleFollow: (targetUserId: string) => void;
    handleShare: (post: Post) => void;
    navigateToNextLevel: (postId: string) => void;
    scrollToNext: (index: number) => void;
}

const ResponseItem = ({
    item, index, isFocused, visibleItemIndex, level,
    likedPosts, followingIds, navigation,
    toggleLike, toggleFollow, handleShare,
    navigateToNextLevel, scrollToNext
}: ResponseItemProps) => {
    const isPaused = !isFocused || visibleItemIndex !== index;
    const isLiked = likedPosts.has(item.id);
    const isFollowing = followingIds.has(item.userId);
    const isCurrentUser = firebaseAuth.currentUser?.uid === item.userId;

    const handleExpandThreads = useCallback(() => {
        navigateToNextLevel(item.id);
    }, [item.id, navigateToNextLevel]);

    const handleScrollToNextItem = useCallback(() => {
        scrollToNext(index + 1);
    }, [index, scrollToNext]);

    const handleNavigateToUpload = useCallback(() => {
        navigation.navigate('Upload', {
            responseTo: item.id,
            isResponse: true
        });
    }, [item.id, navigation]);

    const swipeUpGesture = useMemo(() => Gesture.Pan()
        .activeOffsetY(-30)
        .onEnd((e) => {
            'worklet';
            if (e.velocityY < -300 || e.translationY < -80) {
                runOnJS(handleExpandThreads)();
            }
        }), [handleExpandThreads]);

    const swipeLeftGesture = useMemo(() => Gesture.Pan()
        .activeOffsetX(-50)
        .failOffsetY([-50, 50])
        .onEnd((e) => {
            'worklet';
            if (e.velocityX < -500) {
                runOnJS(handleScrollToNextItem)();
            }
        }), [handleScrollToNextItem]);

    const swipeRightGesture = useMemo(() => Gesture.Pan()
        .activeOffsetX(50)
        .failOffsetY([-50, 50])
        .onEnd((e) => {
            'worklet';
            if (e.velocityX > 500) {
                runOnJS(handleNavigateToUpload)();
            }
        }), [handleNavigateToUpload]);

    const composedGesture = useMemo(() =>
        Gesture.Simultaneous(swipeUpGesture, swipeLeftGesture, swipeRightGesture),
        [swipeUpGesture, swipeLeftGesture, swipeRightGesture]
    );

    return (
        <GestureDetector gesture={composedGesture}>
            <View style={styles.postContainer}>
                <HLSVideoPlayer
                    videoUrl={item.videoUrl}
                    thumbnail={item.thumbnailUrl}
                    paused={isPaused}
                />

                <View style={styles.responseIndicator}>
                    <MessageCircle color={COLORS.primary} size={14} />
                    <Text style={styles.responseIndicatorText}>
                        Response {level > 0 ? `(Level ${level + 1})` : ''}
                    </Text>
                </View>

                <View style={styles.overlay}>
                    <View style={styles.rightActions}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Profile', { userId: item.userId })}
                        >
                            <Image source={{ uri: item.userAvatar || 'https://via.placeholder.com/50' }} style={styles.avatar} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item.id)}>
                            <Heart color={isLiked ? COLORS.error : COLORS.white} fill={isLiked ? COLORS.error : 'transparent'} size={32} />
                            <Text style={styles.actionText}>{item.likes || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigateToNextLevel(item.id)}>
                            <MessageCircle color={COLORS.white} size={32} />
                            <Text style={styles.actionText}>{item.responses || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
                            <Share2 color={COLORS.white} size={28} />
                            <Text style={styles.actionText}>{item.shares || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.responseBtn}
                            onPress={() => navigation.navigate('Upload', { responseTo: item.id, isResponse: true })}
                        >
                            <Camera color={COLORS.background} size={24} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomInfo}>
                        <View style={styles.userInfo}>
                            <View style={styles.usernameRow}>
                                <Text style={styles.username}>@{item.username}</Text>
                                {item.career_tier_id && (
                                    <View style={[styles.inlineTierBadge, { backgroundColor: CAREER_TIERS.find(t => t.id === item.career_tier_id)?.color || COLORS.primary }]}>
                                        <Trophy color={COLORS.background} size={8} />
                                    </View>
                                )}
                            </View>
                            {!isCurrentUser && (
                                <TouchableOpacity
                                    style={[styles.followBtn, isFollowing && styles.followingBtn]}
                                    onPress={() => toggleFollow(item.userId)}
                                >
                                    {isFollowing ? <UserCheck color={COLORS.white} size={16} /> : <UserPlus color={COLORS.white} size={16} />}
                                </TouchableOpacity>
                            )}
                        </View>
                        {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
                    </View>
                </View>
            </View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    postContainer: {
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: SPACING.md,
        paddingBottom: 100,
    },
    rightActions: {
        position: 'absolute',
        right: 8,
        bottom: 120,
        gap: SPACING.md,
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
    responseBtn: {
        backgroundColor: COLORS.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    responseIndicator: {
        position: 'absolute',
        top: 100,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    responseIndicatorText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
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
});

export default React.memo(ResponseItem);
