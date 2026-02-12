import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import HLSVideoPlayer from './HLSVideoPlayer';
import { Heart, MessageCircle, Share2, UserCheck, UserPlus, ChevronUp, Plus } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/theme';
import { Post } from '../api/postService';
import { firebaseAuth } from '../api/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

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
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [paused, setPaused] = useState(true);

    // Animation for the "Swipe up" prompt
    const swipeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setPaused(!isVisible || !isFocused);

        if (isVisible && isFocused) {
            // Animate swipe prompt
            Animated.loop(
                Animated.sequence([
                    Animated.timing(swipeAnim, {
                        toValue: -10,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(swipeAnim, {
                        toValue: 0,
                        duration: 800,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        } else {
            swipeAnim.setValue(0);
        }
    }, [isVisible, isFocused]);

    const onGestureEvent = Animated.event(
        [{ nativeEvent: { translationY: new Animated.Value(0) } }],
        { useNativeDriver: true }
    );

    const onHandlerStateChange = ({ nativeEvent }: any) => {
        if (nativeEvent.oldState === State.ACTIVE) {
            // Swipe Right detection (positive translationX)
            if (nativeEvent.translationX > 80) {
                navigation.navigate('Upload', { responseTo: item.id });
            }
        }
    };

    return (
        <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
        >
            <View style={[styles.container, { height: height - (Platform.OS === 'android' ? 0 : insets.bottom) }]}>
                <HLSVideoPlayer
                    videoUrl={item.videoUrl}
                    thumbnail={item.thumbnailUrl}
                    paused={paused}
                    repeat={true}
                    style={styles.video}
                />

                <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom + 80 }]}>

                    {/* Swipe Up Hint */}
                    <Animated.View style={[styles.swipeHint, { transform: [{ translateY: swipeAnim }] }]}>
                        <TouchableOpacity
                            style={styles.swipeHintContent}
                            onPress={() => navigation.navigate('ResponseThread', { postId: item.id, level: 0 })}
                        >
                            <ChevronUp color={COLORS.white} size={20} />
                            <Text style={styles.swipeHintText}>Swipe up for responses</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Right Actions */}
                    <View style={styles.rightActions}>
                        <TouchableOpacity onPress={() => onProfilePress(item.userId)} style={styles.avatarContainer}>
                            <Image
                                source={{ uri: item.userAvatar || `https://ui-avatars.com/api/?name=${item.username}` }}
                                style={styles.avatarLarge}
                            />
                            {firebaseAuth.currentUser?.uid !== item.userId && (
                                <TouchableOpacity
                                    style={styles.addIcon}
                                    onPress={() => onFollow(item.userId)}
                                >
                                    <View style={[styles.plusBadge, { backgroundColor: isFollowing ? COLORS.success : COLORS.primary }]}>
                                        <Plus color={COLORS.white} size={12} strokeWidth={3} />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(item.id)}>
                            <Heart
                                color={isLiked ? COLORS.primary : COLORS.white}
                                fill={isLiked ? COLORS.primary : 'transparent'}
                                size={32}
                                strokeWidth={2}
                            />
                            <Text style={styles.actionText}>{item.likes}</Text>
                        </TouchableOpacity>

                        {!isChildMode && (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => onComment(item.id)}>
                                <MessageCircle color={COLORS.white} size={32} strokeWidth={2} />
                                <Text style={styles.actionText}>{item.comments}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(item)}>
                            <Share2 color={COLORS.white} size={32} strokeWidth={2} />
                            <Text style={styles.actionText}>{item.shares || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.respondBtn}
                            onPress={() => navigation.navigate('Upload', { responseTo: item.id })}
                        >
                            <View style={styles.respondIconContainer}>
                                <Plus color={COLORS.background} size={24} strokeWidth={3} />
                            </View>
                            <Text style={styles.respondText}>Respond</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Info */}
                    <View style={styles.bottomInfo}>
                        <TouchableOpacity onPress={() => onProfilePress(item.userId)}>
                            <Text style={styles.username}>@{item.username}</Text>
                        </TouchableOpacity>
                        <Text style={styles.caption} numberOfLines={3}>{item.caption}</Text>

                        {item.hashtags && item.hashtags.length > 0 && (
                            <Text style={styles.hashtags}>
                                {item.hashtags.map(h => `#${h} `)}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        </PanGestureHandler>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width,
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        paddingHorizontal: SPACING.md,
    },
    swipeHint: {
        position: 'absolute',
        top: '15%',
        alignSelf: 'center',
        alignItems: 'center',
    },
    swipeHintContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    swipeHintText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    rightActions: {
        position: 'absolute',
        right: 10,
        bottom: 100,
        alignItems: 'center',
        gap: 20,
    },
    avatarContainer: {
        marginBottom: 10,
        alignItems: 'center',
    },
    avatarLarge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    addIcon: {
        position: 'absolute',
        bottom: -5,
        backgroundColor: 'transparent',
    },
    plusBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    actionBtn: {
        alignItems: 'center',
    },
    actionText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '700',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    respondBtn: {
        alignItems: 'center',
        marginTop: 5,
    },
    respondIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    respondText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '800',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    bottomInfo: {
        width: '75%',
        marginBottom: 20,
    },
    username: {
        color: COLORS.white,
        fontWeight: '800',
        fontSize: 17,
        marginBottom: 6,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    caption: {
        color: COLORS.white,
        fontSize: 15,
        lineHeight: 21,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    hashtags: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '700',
        marginTop: 6,
    },
});

export default React.memo(FeedItem);
