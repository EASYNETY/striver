import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, SafeAreaView, Alert } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { Send, ChevronLeft, Heart } from 'lucide-react-native';
import postService, { Comment } from '../../api/postService';
import { formatDistanceToNow } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const CommentsScreen = ({ navigation, route }: any) => {
    const { postId } = route.params;
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
    const inputRef = React.useRef<TextInput>(null);

    useEffect(() => {
        const unsubscribe = postService.subscribeToComments(postId, (updatedComments) => {
            setComments(updatedComments);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [postId]);

    const threadedComments = React.useMemo(() => {
        const roots = comments.filter(c => !c.parentId);
        const replies = comments.filter(c => c.parentId);

        const result: (Comment & { replyCount?: number; isThreadHeader?: boolean })[] = [];
        roots.forEach(root => {
            const threadReplies = replies.filter(c => c.parentId === root.id);
            const isExpanded = expandedThreads.has(root.id);

            result.push({ ...root, replyCount: threadReplies.length, isThreadHeader: true });

            if (isExpanded) {
                result.push(...threadReplies);
            }
        });
        return result;
    }, [comments, expandedThreads]);

    const toggleThread = (parentId: string) => {
        setExpandedThreads(prev => {
            const next = new Set(prev);
            if (next.has(parentId)) next.delete(parentId);
            else next.add(parentId);
            return next;
        });
    };

    const handleSendComment = async () => {
        if (!newComment.trim()) return;

        const commentText = newComment.trim();
        setNewComment(''); // Clear immediately for better UX

        try {
            // If replying to a reply, use the grandparent's ID as parentId 
            // to keep the UI flattened but tagged
            const effectiveParentId = replyingTo?.parentId || replyingTo?.id;
            await postService.addComment(postId, commentText, effectiveParentId);
            setReplyingTo(null);
        } catch (error) {
            console.error('Error posting comment:', error);
            Alert.alert('Error', 'Failed to post comment');
        }
    };

    const handleLikeComment = async (commentId: string) => {
        try {
            await postService.likeComment(postId, commentId);
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    const handleReply = (comment: Comment) => {
        setReplyingTo(comment);
        setNewComment(`@${comment.username} `);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const renderItem = ({ item }: { item: Comment & { replyCount?: number; isThreadHeader?: boolean } }) => (
        <View>
            <View style={[styles.commentItem, item.parentId && styles.replyItem]}>
                <Image
                    source={{ uri: item.userAvatar || 'https://ui-avatars.com/api/?name=' + item.username }}
                    style={[styles.avatar, item.parentId && styles.replyAvatar]}
                />
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.username}>@{item.username}</Text>
                        <Text style={styles.time}>
                            {item.createdAt ? formatDistanceToNow(new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt), { addSuffix: true }) : 'just now'}
                        </Text>
                    </View>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <View style={styles.commentActions}>
                        <TouchableOpacity onPress={() => handleReply(item)}>
                            <Text style={styles.actionText}>Reply</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Upload', {
                                responseTo: postId,
                                commentId: item.id,
                                isResponse: true
                            })}
                        >
                            <Text style={[styles.actionText, { color: COLORS.primary }]}>Video Reply</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.likeContainer} onPress={() => handleLikeComment(item.id)}>
                            <Heart size={14} color={item.likes > 0 ? COLORS.primary : COLORS.textSecondary} fill={item.likes > 0 ? COLORS.primary : 'transparent'} />
                            <Text style={styles.likeCount}>{item.likes || 0}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {item.isThreadHeader && item.replyCount ? (
                <TouchableOpacity
                    style={styles.expandBtn}
                    onPress={() => toggleThread(item.id)}
                >
                    <View style={styles.expandLine} />
                    <Text style={styles.expandText}>
                        {expandedThreads.has(item.id)
                            ? 'Hide replies'
                            : `View ${item.replyCount} ${item.replyCount === 1 ? 'reply' : 'replies'}`}
                    </Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );

    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Comments</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={threadedComments}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                    </View>
                }
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {replyingTo && (
                    <View style={styles.replyingIndicator}>
                        <Text style={styles.replyingText}>Replying to @{replyingTo.username}</Text>
                        <TouchableOpacity onPress={() => { setReplyingTo(null); setNewComment(''); }}>
                            <Text style={styles.cancelReply}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Add a comment..."
                        placeholderTextColor={COLORS.textSecondary}
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !newComment.trim() && styles.sendBtnDisabled]}
                        onPress={handleSendComment}
                        disabled={!newComment.trim()}
                    >
                        <Send color={COLORS.white} size={20} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
    },
    listContent: {
        padding: SPACING.md,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: SPACING.lg,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: SPACING.md,
        backgroundColor: COLORS.surface,
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    username: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.white,
    },
    time: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    commentText: {
        fontSize: 14,
        color: COLORS.white,
        lineHeight: 20,
        marginBottom: 8,
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    likeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    likeCount: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        backgroundColor: COLORS.surface,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        paddingHorizontal: SPACING.md,
        paddingVertical: 10,
        color: COLORS.white,
        maxHeight: 100,
        marginRight: SPACING.md,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: {
        opacity: 0.5,
        backgroundColor: COLORS.textSecondary,
    },
    replyItem: {
        marginLeft: 40,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.1)',
        paddingLeft: 12,
    },
    replyAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    replyingIndicator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    replyingText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    cancelReply: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    },
    expandBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 56,
        marginBottom: SPACING.md,
        marginTop: -SPACING.sm,
    },
    expandLine: {
        width: 20,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginRight: 8,
    },
    expandText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
});

export default CommentsScreen;
