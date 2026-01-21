import { db, firebaseAuth, firebaseStorage } from '../api/firebase';
import firestore from '@react-native-firebase/firestore';
import userService from './userService';
import functions from '@react-native-firebase/functions';

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
    career_tier_id?: string;
    badge_status?: string;
    squadId?: string; // Optional linkage to a squad
    status: 'active' | 'pending' | 'rejected' | 'archived';
    createdAt: Date;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    username: string;
    userAvatar?: string;
    text: string;
    likes: number;
    createdAt: Date;
}

class PostService {
    private postsCollection = db.collection('posts');
    private commentsCollection = db.collection('comments');
    private likesCollection = db.collection('likes');
    private postCache: Map<string, { data: Post[], timestamp: number }> = new Map();
    private cacheExpiry = 5 * 60 * 1000; // 5 minutes

    // Create a new post via Cloudflare Stream
    async createPost(data: {
        videoUri: string;
        caption: string;
        hashtags?: string[];
        squadId?: string; // Optional squad linkage
    }): Promise<string> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        console.log('[PostService] Starting CDN upload flow...');

        try {
            // 1. Get Secure Upload URL from Backend
            // This ensures we never expose API keys in the app
            const getUploadUrlFn = functions().httpsCallable('getUploadUrl');
            const { data: uploadData } = await getUploadUrlFn({});
            const { uploadURL, videoId } = uploadData as { uploadURL: string, videoId: string };

            console.log('[PostService] Got upload URL:', uploadURL);

            // 2. Upload Video Directly to Cloudflare (CDN)
            // This is much faster than uploading to our own backend
            const formData = new FormData();
            formData.append('file', {
                uri: data.videoUri,
                type: 'video/mp4',
                name: 'video.mp4'
            } as any);

            const uploadResponse = await fetch(uploadURL, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('[PostService] CDN Upload Failure:', errorText);
                throw new Error(`Upload failed: ${uploadResponse.status}`);
            }

            console.log('[PostService] CDN Upload Complete');

            // 3. Finalize Post on Backend
            // This stores the metadata and HLS URL in Firestore
            const completeUploadFn = functions().httpsCallable('completeUpload');
            const { data: result } = await completeUploadFn({
                videoId,
                caption: data.caption,
                hashtags: data.hashtags || [],
                squadId: data.squadId
            });

            const { postId } = result as { postId: string };
            console.log('[PostService] Post created successfully:', postId);

            return postId;

        } catch (error: any) {
            console.error('[PostService] Create Post Error:', error);
            throw new Error(error.message || 'Failed to create post');
        }
    }

    // Get feed posts (For You - all posts) with pagination support
    async getFeedPosts(limit: number = 30, _startAfter?: any): Promise<Post[]> {
        try {
            // Check cache first
            const cacheKey = `feed_${limit}`;
            const cached = this.postCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }

            let query = this.postsCollection
                .where('status', '==', 'active')
                .limit(limit);

            const snapshot = await query.get();

            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Post[];

            const sorted = posts.sort((a, b) => {
                const timeA = (a.createdAt as any)?.seconds || 0;
                const timeB = (b.createdAt as any)?.seconds || 0;
                return timeB - timeA;
            });

            // Cache the results
            this.postCache.set(cacheKey, { data: sorted, timestamp: Date.now() });

            return sorted;
        } catch (error) {
            console.error('Error fetching feed posts:', error);
            return [];
        }
    }

    // Get following feed (posts from users you follow)
    async getFollowingFeed(limit: number = 30): Promise<Post[]> {
        try {
            // Check cache first
            const cacheKey = `following_${limit}`;
            const cached = this.postCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }

            const currentUser = firebaseAuth.currentUser;
            if (!currentUser) return [];

            const followingSnapshot = await db
                .collection('following')
                .where('followerId', '==', currentUser.uid)
                .get();

            const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);

            if (followingIds.length === 0) return [];

            // Chunking the followingIds for Firestore 'in' limit
            const chunk = followingIds.slice(0, 10);

            const snapshot = await this.postsCollection
                .where('userId', 'in', chunk)
                .where('status', '==', 'active')
                .limit(limit)
                .get();

            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Post[];

            const sorted = posts.sort((a, b) => {
                const timeA = (a.createdAt as any)?.seconds || 0;
                const timeB = (b.createdAt as any)?.seconds || 0;
                return timeB - timeA;
            });

            // Cache the results
            this.postCache.set(cacheKey, { data: sorted, timestamp: Date.now() });

            return sorted;
        } catch (error) {
            console.error('Error fetching following feed:', error);
            return [];
        }
    }

    // Get posts for a specific squad
    async getSquadPosts(squadId: string): Promise<Post[]> {
        const snapshot = await this.postsCollection
            .where('squadId', '==', squadId)
            .where('status', '==', 'active')
            .get();

        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Post[];

        return posts.sort((a, b) => {
            const timeA = (a.createdAt as any)?.seconds || 0;
            const timeB = (b.createdAt as any)?.seconds || 0;
            return timeB - timeA;
        });
    }

    // Get user's posts
    async getUserPosts(userId: string): Promise<Post[]> {
        const snapshot = await this.postsCollection
            .where('userId', '==', userId)
            .get();

        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Post[];

        return posts.sort((a, b) => {
            const timeA = (a.createdAt as any)?.seconds || 0;
            const timeB = (b.createdAt as any)?.seconds || 0;
            return timeB - timeA;
        });
    }

    // Like a post
    async likePost(postId: string): Promise<void> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        const likeId = `${currentUser.uid}_${postId}`;

        await this.likesCollection.doc(likeId).set({
            userId: currentUser.uid,
            postId,
            createdAt: firestore.FieldValue.serverTimestamp(),
        });

        await this.postsCollection.doc(postId).update({
            likes: firestore.FieldValue.increment(1),
        });
    }

    // Unlike a post
    async unlikePost(postId: string): Promise<void> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        const likeId = `${currentUser.uid}_${postId}`;

        await this.likesCollection.doc(likeId).delete();

        await this.postsCollection.doc(postId).update({
            likes: firestore.FieldValue.increment(-1),
        });
    }

    // Check if user liked a post
    async hasLikedPost(postId: string): Promise<boolean> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return false;

        const likeId = `${currentUser.uid}_${postId}`;
        const doc = await this.likesCollection.doc(likeId).get();

        return doc.exists;
    }

    // Add comment to post
    async addComment(postId: string, text: string): Promise<void> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();

        await this.commentsCollection.add({
            postId,
            userId: currentUser.uid,
            username: userData?.username || 'user',
            userAvatar: userData?.avatar || '',
            text,
            likes: 0,
            createdAt: firestore.FieldValue.serverTimestamp(),
        });

        await this.postsCollection.doc(postId).update({
            comments: firestore.FieldValue.increment(1),
        });

        // Update user's reply count
        await db.collection('users').doc(currentUser.uid).update({
            replies: firestore.FieldValue.increment(1),
        });
    }

    // Get comments for a post
    async getComments(postId: string): Promise<Comment[]> {
        const snapshot = await this.commentsCollection
            .where('postId', '==', postId)
            .get();

        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Comment[];

        return comments.sort((a, b) => {
            const timeA = (a.createdAt as any)?.seconds || 0;
            const timeB = (b.createdAt as any)?.seconds || 0;
            return timeB - timeA;
        });
    }

    subscribeToComments(postId: string, callback: (comments: Comment[]) => void): () => void {
        return this.commentsCollection
            .where('postId', '==', postId)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                if (!snapshot) return;
                const comments = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Comment[];
                callback(comments);
            }, error => {
                console.error("Comments error:", error);
            });
    }

    // Increment share count
    async sharePost(postId: string): Promise<void> {
        await this.postsCollection.doc(postId).update({
            shares: firestore.FieldValue.increment(1),
        });
    }

    // Upload video to Firebase Storage
    private async uploadVideo(userId: string, videoUri: string): Promise<string> {
        if (videoUri.startsWith('http')) return videoUri;

        const filename = `videos/${userId}_${Date.now()}.mp4`;
        const reference = firebaseStorage.ref(filename);

        await reference.putFile(videoUri);
        return await reference.getDownloadURL();
    }

    // Subscribe to feed updates - with caching and instant first load
    subscribeToFeedPosts(callback: (posts: Post[]) => void, limit: number = 30): () => void {
        // Send cached data immediately if available
        const cacheKey = `feed_${limit}`;
        const cached = this.postCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            callback(cached.data);
        }

        // Also set up real-time listener for updates
        return this.postsCollection
            .where('status', '==', 'active')
            .limit(limit)
            .onSnapshot(snapshot => {
                if (!snapshot) return;
                const posts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Post[];

                const sorted = posts.sort((a, b) => {
                    const timeA = (a.createdAt as any)?.seconds || 0;
                    const timeB = (b.createdAt as any)?.seconds || 0;
                    return timeB - timeA;
                });

                // Update cache
                this.postCache.set(cacheKey, { data: sorted, timestamp: Date.now() });

                callback(sorted);
            }, error => {
                console.error("Feed error:", error);
            });
    }

    subscribeToFollowingFeed(callback: (posts: Post[]) => void, limit: number = 30): () => void {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return () => { };

        // Send cached data immediately if available
        const cacheKey = `following_${limit}`;
        const cached = this.postCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            callback(cached.data);
        }

        return db.collection('following')
            .where('followerId', '==', currentUser.uid)
            .onSnapshot(async followingSnapshot => {
                if (!followingSnapshot) return;
                const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);

                if (followingIds.length === 0) {
                    callback([]);
                    return;
                }

                const chunk = followingIds.slice(0, 10);

                this.postsCollection
                    .where('userId', 'in', chunk)
                    .where('status', '==', 'active')
                    .limit(limit)
                    .onSnapshot(postSnapshot => {
                        if (!postSnapshot) return;
                        const posts = postSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                        })) as Post[];

                        const sorted = posts.sort((a, b) => {
                            const timeA = (a.createdAt as any)?.seconds || 0;
                            const timeB = (b.createdAt as any)?.seconds || 0;
                            return timeB - timeA;
                        });

                        // Update cache
                        this.postCache.set(cacheKey, { data: sorted, timestamp: Date.now() });

                        callback(sorted);
                    }, error => {
                        console.error("Following posts error:", error);
                    });
            }, error => {
                console.error("Following list error:", error);
            });
    }
}

export default new PostService();
