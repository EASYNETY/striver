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
    coins: number;
    isLegend?: boolean;
    status: 'active' | 'pending' | 'rejected' | 'ready';
    createdAt: any;
    squadId?: string;
    career_tier_id?: string;
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

    async addComment(postId: string, text: string): Promise<void> {
        const user = firebaseAuth.currentUser;
        if (!user) return;

        await addDoc(this.commentsCollection, {
            postId,
            userId: user.uid,
            username: user.displayName || 'User',
            text,
            likes: 0,
            createdAt: serverTimestamp(),
        });

        await updateDoc(doc(this.postsCollection, postId), {
            comments: increment(1),
        });
    }

    subscribeToComments(postId: string, callback: (comments: Comment[]) => void): () => void {
        const q = query(this.commentsCollection, where('postId', '==', postId), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snapshot => {
            if (!snapshot) return;
            const comments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
            callback(comments);
        }, (err) => {
            console.error('Comments listener error:', err);
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
}

export default new PostService();
