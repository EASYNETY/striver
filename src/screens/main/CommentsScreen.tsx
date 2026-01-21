import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { Send, ChevronLeft, Heart } from 'lucide-react-native';
import postService, { Comment } from '../../api/postService';
import { formatDistanceToNow } from 'date-fns';

const CommentsScreen = ({ navigation, route }: any) => {
    const { postId } = route.params;
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = postService.subscribeToComments(postId, (updatedComments) => {
            setComments(updatedComments);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [postId]);

    const handleSendComment = async () => {
        if (!newComment.trim()) return;

        const commentText = newComment.trim();
        setNewComment(''); // Clear immediately for better UX

        try {
            await postService.addComment(postId, commentText);
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment');
        }
    };

    const renderItem = ({ item }: { item: Comment }) => (
        <View style={styles.commentItem}>
            <Image
                source={{ uri: item.userAvatar || 'https://ui-avatars.com/api/?name=' + item.username }}
                style={styles.avatar}
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
                    <Text style={styles.actionText}>Reply</Text>
                    <View style={styles.likeContainer}>
                        <Heart size={12} color={COLORS.textSecondary} />
                        <Text style={styles.likeCount}>{item.likes || 0}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Comments</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={comments}
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
                <View style={styles.inputContainer}>
                    <TextInput
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
});

export default CommentsScreen;
