import { db, firebaseAuth, firebaseStorage, modularDb, cloudFunctions } from '../api/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    onSnapshot,
    query,
    where,
    limit,
    orderBy,
    serverTimestamp,
    increment,
    FieldValue
} from '@react-native-firebase/firestore';
import { httpsCallable } from '@react-native-firebase/functions';
import userService from './userService';

export interface Post {
    id: string;
    userId: string;
    username: string;
    userAvatar?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    caption: string;
    hashtags: string[];
    likes: number;
    comments: number;
    shares: number;
    responses: number;
    coins: number;
    isLegend?: boolean;
    status: 'active' | 'pending' | 'rejected' | 'ready';
    createdAt: any;
    squadId?: string;
    career_tier_id?: string;
    responseTo?: string; // ID of the post this is responding to
    challengeId?: string;
    views?: number;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    username: string;
    userAvatar?: string;
    text: string;
    likes: number;
    createdAt: any;
    parentId?: string; // Optional parent comment ID for threading
}

class PostService {
    private postsCollection = collection(modularDb, 'posts');
    private commentsCollection = collection(modularDb, 'comments');
    private likesCollection = collection(modularDb, 'likes');
    private followingCollection = collection(modularDb, 'following');

    async createPost(data: {
        videoUri: string;
        caption: string;
        hashtags?: string[];
        squadId?: string;
    }): Promise<string> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        try {
            const getUploadUrlFn = httpsCallable(cloudFunctions, 'getUploadUrl');
            const result = await getUploadUrlFn({});
            const { uploadUrl, videoId } = result.data as any;

            const formData = new FormData();
            formData.append('file', {
                uri: data.videoUri,
                type: 'video/mp4',
                name: 'video.mp4'
            } as any);

            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) throw new Error('Upload failed');

            const completeUploadFn = httpsCallable(cloudFunctions, 'completeUpload');
            const finalizeResult = await completeUploadFn({
                videoId,
                caption: data.caption,
                hashtags: data.hashtags || [],
                squadId: data.squadId
            });

            return (finalizeResult.data as any).postId;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to create post');
        }
    }

    async getFeedPosts(limitCount: number = 30): Promise<Post[]> {
        const q = query(
            this.postsCollection,
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
    }

    subscribeToFeedPosts(callback: (posts: Post[]) => void): () => void {
        const q = query(
            this.postsCollection,
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        return onSnapshot(q, snapshot => {
            if (!snapshot) return;
            const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
            callback(posts);
        }, (err) => {
            console.error('Feed listener error:', err);
        });
    }

    async getFollowingFeed(limitCount: number = 30): Promise<Post[]> {
        const uid = firebaseAuth.currentUser?.uid;
        if (!uid) return [];

        // 1. Get people the user follows
        const followingQuery = query(this.followingCollection, where('followerId', '==', uid));
        const followingSnap = await getDocs(followingQuery);
        const followingIds = followingSnap.docs.map(d => d.data().followingId);

        if (followingIds.length === 0) return [];

        // 2. Get posts from those users
        const q = query(
            this.postsCollection,
            where('userId', 'in', followingIds),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
    }

    subscribeToFollowingFeed(callback: (posts: Post[]) => void): () => void {
        const uid = firebaseAuth.currentUser?.uid;
        if (!uid) {
            callback([]);
            return () => { };
        }

        // Real-time following feed is tricky without a composite query or multiple listeners.
        // For simplicity, we'll fetch once and then listen to those users' posts.
        let unsubscribePosts: (() => void) | null = null;

        const unsubscribeFollowing = onSnapshot(query(this.followingCollection, where('followerId', '==', uid)), async (followingSnap) => {
            if (unsubscribePosts) unsubscribePosts();

            const followingIds = followingSnap.docs.map(d => d.data().followingId);
            if (followingIds.length === 0) {
                callback([]);
                return;
            }

            const q = query(
                this.postsCollection,
                where('userId', 'in', followingIds),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            unsubscribePosts = onSnapshot(q, (postSnap) => {
                if (!postSnap) return;
                const posts = postSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
                callback(posts);
            });
        });

        return () => {
            unsubscribeFollowing();
            if (unsubscribePosts) unsubscribePosts();
        };
    }

    async likePost(postId: string): Promise<void> {
        const uid = firebaseAuth.currentUser?.uid;
        if (!uid) return;
        const likeId = `${uid}_${postId}`;

        await setDoc(doc(this.likesCollection, likeId), {
            userId: uid,
            postId,
            createdAt: serverTimestamp(),
        });

        await updateDoc(doc(this.postsCollection, postId), {
            likes: increment(1),
        });
    }

    async unlikePost(postId: string): Promise<void> {
        const uid = firebaseAuth.currentUser?.uid;
        if (!uid) return;
        const likeId = `${uid}_${postId}`;

        await deleteDoc(doc(this.likesCollection, likeId));

        await updateDoc(doc(this.postsCollection, postId), {
            likes: increment(-1),
        });
    }

    async addComment(postId: string, text: string, parentId?: string): Promise<void> {
        const user = firebaseAuth.currentUser;
        if (!user) return;

        let username = user.displayName || `user_${user.uid.substring(0, 8)}`;
        let userAvatar = user.photoURL || '';

        try {
            const profile = await userService.getCurrentUserProfile();
            if (profile) {
                // If in child mode, use the child profile info
                if (profile.activeProfileId) {
                    const children = await userService.getChildren(user.uid);
                    const activeChild = children.find(c => c.id === profile.activeProfileId);
                    if (activeChild) {
                        username = activeChild.displayName || activeChild.firstName;
                        userAvatar = activeChild.avatar || userAvatar;
                    }
                } else {
                    username = profile.username || username;
                    userAvatar = profile.avatar || userAvatar;
                }
            }
        } catch (error) {
            console.warn('[PostService] Error fetching profile for comment:', error);
        }

        try {
            await addDoc(this.commentsCollection, {
                postId,
                userId: user.uid,
                username,
                userAvatar,
                text,
                likes: 0,
                createdAt: serverTimestamp(),
                parentId: parentId || null,
            });

            // Increment comment count on the post
            await updateDoc(doc(this.postsCollection, postId), {
                comments: increment(1),
            });
        } catch (error: any) {
            console.error('[PostService] Error adding comment:', error);
            if (error.code === 'permission-denied') {
                throw new Error('You do not have permission to comment on this post.');
            }
            throw error;
        }
    }

    subscribeToComments(postId: string, callback: (comments: Comment[]) => void): () => void {
        const q = query(this.commentsCollection, where('postId', '==', postId));
        return onSnapshot(q, snapshot => {
            if (!snapshot) return;
            const comments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Comment));

            // Sort in memory to avoid needing a composite index for now
            const sortedComments = comments.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });

            callback(sortedComments);
        }, (err) => {
            console.error('Comments listener error:', err);
        });
    }

    async likeComment(postId: string, commentId: string): Promise<void> {
        const uid = firebaseAuth.currentUser?.uid;
        if (!uid) return;

        try {
            // 1. Record the like (helps with rules and tracking)
            const likeId = `${uid}_comment_${commentId}`;
            await setDoc(doc(this.likesCollection, likeId), {
                userId: uid,
                postId,
                commentId,
                type: 'comment',
                createdAt: serverTimestamp(),
            });

            // 2. Increment counter on the comment document
            // NOTE: If this fails with permission-denied, it means the security rules 
            // prevent users from updating the 'likes' field on comments they don't own.
            try {
                await updateDoc(doc(this.commentsCollection, commentId), {
                    likes: increment(1),
                });
            } catch (updateError: any) {
                if (updateError.code === 'permission-denied') {
                    console.warn('[PostService] Permission denied updating like count. This is likely due to Firestore rules. The like record was created, but the visual count might not update immediately.');
                } else {
                    throw updateError;
                }
            }
        } catch (error: any) {
            console.error('[PostService] Error liking comment:', error);
            throw error;
        }
    }

    subscribeToPostUpdates(postId: string, callback: (post: Post | null) => void): () => void {
        const postRef = doc(this.postsCollection, postId);
        return onSnapshot(postRef, (snapshot) => {
            if (snapshot.exists) {
                callback({ id: snapshot.id, ...snapshot.data() } as Post);
            } else {
                callback(null);
            }
        });
    }

    async getSquadPosts(squadId: string, limitCount: number = 30): Promise<Post[]> {
        const q = query(
            this.postsCollection,
            where('squadId', '==', squadId),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
    }

    async getUserPosts(userId: string, limitCount: number = 30): Promise<Post[]> {
        const q = query(
            this.postsCollection,
            where('userId', '==', userId),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
    }

    // Get a single post by ID
    async getPostById(postId: string): Promise<Post | null> {
        try {
            const postDoc = await getDoc(doc(this.postsCollection, postId));
            if (!postDoc.exists) return null;
            return { id: postDoc.id, ...postDoc.data() } as Post;
        } catch (error) {
            console.error('Error getting post:', error);
            return null;
        }
    }

    // Get all responses for a specific post
    async getResponsesForPost(postId: string, limitCount: number = 50): Promise<Post[]> {
        try {
            const q = query(
                this.postsCollection,
                where('responseTo', '==', postId),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        } catch (error: any) {
            // FALLBACK: If index is missing, try query without orderBy and sort in memory
            if (error?.message?.includes('index')) {
                console.warn('[PostService] Firestore index not ready, using memory fallback for responses...');
                try {
                    const fallbackQ = query(
                        this.postsCollection,
                        where('responseTo', '==', postId),
                        where('status', '==', 'active'),
                        limit(limitCount)
                    );
                    const snapshot = await getDocs(fallbackQ);
                    const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));

                    // Sort in memory (descending by createdAt)
                    return posts.sort((a, b) => {
                        const dateA = a.createdAt?.seconds || 0;
                        const dateB = b.createdAt?.seconds || 0;
                        return dateB - dateA;
                    });
                } catch (fallbackError) {
                    console.error('[PostService] Fallback query failed:', fallbackError);
                }
            }

            console.error('Error getting responses:', error);
            return [];
        }
    }

    // Get all posts liked by a user
    async getUserLikedPosts(userId: string): Promise<string[]> {
        try {
            const q = query(
                this.likesCollection,
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => d.data().postId);
        } catch (error) {
            console.error('Error getting liked posts:', error);
            return [];
        }
    }

    // Share a post (increment share count)
    async sharePost(postId: string): Promise<void> {
        try {
            await updateDoc(doc(this.postsCollection, postId), {
                shares: increment(1),
            });
        } catch (error) {
            console.error('Error sharing post:', error);
        }
    }
}

export default new PostService();
