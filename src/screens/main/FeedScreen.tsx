import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import VideoFeed from '../../components/VideoFeed';
import postService, { Post } from '../../api/postService';
import { COLORS } from '../../constants/theme';

const FeedScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { userId, squadId, initialPostId, posts: initialPosts } = route.params || {};

    const [posts, setPosts] = useState<Post[]>(initialPosts || []);
    const [loading, setLoading] = useState(!initialPosts);
    const [initialIndex, setInitialIndex] = useState(() => {
        if (initialPosts && initialPostId) {
            const idx = (initialPosts as Post[]).findIndex(p => p.id === initialPostId);
            return idx >= 0 ? idx : 0;
        }
        return 0;
    });

    useEffect(() => {
        loadPosts();
    }, [userId, squadId]);

    const loadPosts = async () => {
        if (initialPosts) {
            findInitialIndex(initialPosts);
            return;
        }

        try {
            setLoading(true);
            let fetchedPosts: Post[] = [];

            if (userId) {
                fetchedPosts = await postService.getUserPosts(userId);
            } else if (squadId) {
                fetchedPosts = await postService.getSquadPosts(squadId);
            }

            setPosts(fetchedPosts);
            findInitialIndex(fetchedPosts);
        } catch (error) {
            console.error('Error loading feed posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const findInitialIndex = (data: Post[]) => {
        if (initialPostId) {
            const index = data.findIndex(p => p.id === initialPostId);
            if (index !== -1) setInitialIndex(index);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="black" translucent />

            <VideoFeed
                posts={posts}
                initialScrollIndex={initialIndex}
                onRefresh={loadPosts}
            />

            <SafeAreaView style={styles.backButtonArea}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonArea: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 40 : 0,
        left: 10,
    },
    backBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    }
});

export default FeedScreen;
