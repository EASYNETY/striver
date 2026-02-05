import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import HLSVideoPlayer from './HLSVideoPlayer';
import { Heart, MessageCircle, Share2, UserCheck, UserPlus } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/theme';
import { Post } from '../api/postService';
import { firebaseAuth } from '../api/firebase';

const { width, height } = Dimensions.get('window');

interface FeedItemProps {
    item: Post;
    isVisible: boolean;
    isFocused: boolean;
    onLike: (id: string) => void;
    onShare: (post: Post) => void;
    onComment: (id: string) => void;
    onFollow: (userId: string) => void;
    onProfilePress: (userId: string) => void;
    isLiked: boolean;
    isFollowing: boolean;
    isChildMode?: boolean;
}

const FeedItem = ({
    item,
    isVisible,
    isFocused,
    onLike,
    onShare,
    onComment,
    onFollow,
    onProfilePress,
    isLiked,
    isFollowing,
    isChildMode
}: FeedItemProps) => {
    const videoRef = useRef<any>(null);
    const [paused, setPaused] = useState(true);

    useEffect(() => {
        // Play only when visible and screen is focused
        setPaused(!isVisible || !isFocused);
    }, [isVisible, isFocused]);

    return (
        <View style={styles.container}>
            <HLSVideoPlayer
                videoUrl={item.videoUrl}
                thumbnail={item.thumbnailUrl}
                paused={paused}
                repeat={true}
                style={styles.video}
            />

            <View style={styles.overlay}>
                {/* Right Actions */}
                <View style={styles.rightActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(item.id)}>
                        <Heart
                            color={isLiked ? COLORS.primary : COLORS.white}
                            fill={isLiked ? COLORS.primary : 'transparent'}
                            size={32}
                            strokeWidth={1.5}
                        />
                        <Text style={styles.actionText}>{item.likes}</Text>
                    </TouchableOpacity>

                    {!isChildMode && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => onComment(item.id)}>
                            <MessageCircle color={COLORS.white} size={32} strokeWidth={1.5} />
                            <Text style={styles.actionText}>{item.comments}</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(item)}>
                        <Share2 color={COLORS.white} size={32} strokeWidth={1.5} />
                        <Text style={styles.actionText}>{item.shares || 'Share'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Info */}
                <View style={styles.bottomInfo}>
                    <View style={styles.userInfo}>
                        <TouchableOpacity onPress={() => onProfilePress(item.userId)}>
                            <Image
                                source={{ uri: item.userAvatar || `https://ui-avatars.com/api/?name=${item.username}` }}
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <View style={styles.usernameRow}>
                                <TouchableOpacity onPress={() => onProfilePress(item.userId)}>
                                    <Text style={styles.username}>@{item.username}</Text>
                                </TouchableOpacity>
                                {firebaseAuth.currentUser?.uid !== item.userId && (
                                    <TouchableOpacity
                                        style={[styles.followBtn, isFollowing && styles.followingBtn]}
                                        onPress={() => onFollow(item.userId)}
                                    >
                                        {isFollowing ? (
                                            <UserCheck color={COLORS.white} size={14} />
                                        ) : (
                                            <UserPlus color={COLORS.primary} size={14} />
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

const styles = StyleSheet.create({
    container: {
        width: width,
        height: height - 70, // Adjust based on tab bar height if needed, usually full height
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: SPACING.md,
        paddingBottom: 20, // Add bottom padding for safety
    },
    rightActions: {
        position: 'absolute',
        right: 10,
        bottom: 120, // Adjust vertically
        alignItems: 'center',
        gap: 20,
    },
    actionBtn: {
        alignItems: 'center',
    },
    actionText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    bottomInfo: {
        width: '85%',
        marginBottom: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.white,
        marginRight: 10,
    },
    usernameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    username: {
        color: COLORS.white,
        fontWeight: '800',
        fontSize: 16,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    followBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    followingBtn: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    caption: {
        color: COLORS.white,
        fontSize: 14,
        lineHeight: 20,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
});

export default React.memo(FeedItem);
