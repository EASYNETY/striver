import { db, firebaseAuth, firebaseStorage } from '../api/firebase';
import firestore from '@react-native-firebase/firestore';

export type AccountType = 'family' | 'individual';
export type AgeTier = 'junior_baller' | 'academy_prospect' | 'first_teamer';
export type RewardTier = 'Future Star' | 'Local Hero' | 'Academy Prospect' | 'First Teamer' | 'Captain' | 'MVP' | 'Elite' | 'Legend' | 'Icon' | 'GOAT';

export interface UserProfile {
    uid: string;
    username: string;
    email: string;
    displayName?: string;
    phoneNumber?: string;
    bio?: string;
    avatar?: string;

    // Striver Specifics
    accountType: AccountType;
    ageTier: AgeTier;
    dob?: string;
    isPrivate?: boolean;

    tier: RewardTier;
    coins: number;
    followers: number;
    following: number;
    replies: number;
    onboardingComplete?: boolean;

    // Family Specifics
    activeProfileId?: string; // Currently switched to this child profile (if family)
    parentUid?: string;

    createdAt: any;
    updatedAt: any;
}

export interface ChildProfile {
    id: string;
    parentUid: string;
    firstName: string;
    displayName: string;
    dob: string;
    favTeam?: string;
    ageTier: 'junior_baller';
    avatar?: string;
    coins: number;

    // Safety Defaults
    isPrivate: boolean;
    commentsDisabled: boolean;
    dmsRedirectedToParent: boolean;
    restrictedSocial: boolean;
    screenTimeLimit: number; // minutes
    bedtimeModeEnabled: boolean;
    dailySpendingLimit: number;

    createdAt: any;
}

class UserService {
    private usersCollection = db.collection('users');

    // Get current user profile
    async getCurrentUserProfile(): Promise<UserProfile | null> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return null;

        const doc = await this.usersCollection.doc(currentUser.uid).get();

        if (!doc.exists) {
            // Auto-create profile if missing
            const defaultProfile = {
                username: currentUser.email?.split('@')[0] || `user_${currentUser.uid.substring(0, 8)}`,
                email: currentUser.email || '',
                displayName: currentUser.displayName || '',
                bio: '',
                avatar: currentUser.photoURL || '',
                accountType: 'individual' as const,
                ageTier: 'academy_prospect' as const,
                tier: 'Future Star' as const,
                coins: 0,
                followers: 0,
                following: 0,
                replies: 0,
                onboardingComplete: false,
                createdAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            await this.usersCollection.doc(currentUser.uid).set(defaultProfile);
            return { uid: currentUser.uid, ...defaultProfile } as unknown as UserProfile;
        }

        const data = doc.data() as any;
        return {
            uid: doc.id,
            accountType: data.accountType || 'individual',
            ageTier: data.ageTier || 'academy_prospect',
            tier: data.tier || 'Future Star',
            coins: data.coins || 0,
            onboardingComplete: data.onboardingComplete ?? false,
            ...data
        } as UserProfile;
    }

    // Get user profile by ID
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        const doc = await this.usersCollection.doc(uid).get();
        if (!doc.exists) return null;

        return { uid: doc.id, ...doc.data() } as UserProfile;
    }

    // Real-time profile listener
    onProfileChange(uid: string, callback: (profile: UserProfile | null) => void) {
        return this.usersCollection.doc(uid).onSnapshot(
            (doc) => {
                if (doc.exists) {
                    callback({ uid: doc.id, ...doc.data() } as UserProfile);
                } else {
                    callback(null);
                }
            },
            (error) => {
                console.error("Error listening to profile:", error);
            }
        );
    }

    subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
        return this.onProfileChange(uid, callback);
    }

    // Create user profile (called after signup)
    async createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
        await this.usersCollection.doc(uid).set({
            username: data.username || `user_${uid.substring(0, 8)}`,
            email: data.email || '',
            displayName: data.displayName || '',
            bio: data.bio || '',
            avatar: data.avatar || '',
            accountType: data.accountType || 'individual',
            ageTier: data.ageTier || 'academy_prospect',
            tier: 'Future Star',
            coins: 0,

            followers: 0,
            following: 0,
            replies: 0,
            onboardingComplete: false,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    }

    // Update user profile
    async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
        // Remove undefined values to prevent Firestore error
        const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as any);

        await this.usersCollection.doc(uid).update({
            ...cleanData,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    }

    // Add coins to user
    async addCoins(uid: string, amount: number): Promise<void> {
        await this.usersCollection.doc(uid).update({
            coins: firestore.FieldValue.increment(amount),
        });
    }

    // Deduct coins from user
    async deductCoins(uid: string, amount: number): Promise<void> {
        await this.usersCollection.doc(uid).update({
            coins: firestore.FieldValue.increment(-amount),
        });
    }

    // Upload avatar helper
    async uploadAvatar(uid: string, fileUri: string): Promise<string> {
        const reference = firebaseStorage.ref(`avatars/${uid}`);
        await reference.putFile(fileUri);
        const url = await reference.getDownloadURL();
        await this.updateUserProfile(uid, { avatar: url });
        return url;
    }

    // Upload verification photo for age verification
    async uploadVerificationPhoto(uid: string, fileUri: string): Promise<string> {
        const timestamp = Date.now();
        const reference = firebaseStorage.ref(`verification_photos/${uid}_${timestamp}.jpg`);
        await reference.putFile(fileUri);
        const url = await reference.getDownloadURL();
        return url;
    }

    // Update user's reward tier based on activity/coins (example logic)
    async updateRewardTier(userId: string): Promise<void> {
        const userProfile = await this.getUserProfile(userId);
        if (!userProfile) return;

        let newTier: RewardTier = 'Future Star';
        if (userProfile.coins >= 1000) newTier = 'Icon';
        else if (userProfile.coins >= 500) newTier = 'Elite';
        else if (userProfile.coins >= 200) newTier = 'MVP';
        else if (userProfile.coins >= 100) newTier = 'Captain';
        else if (userProfile.coins >= 50) newTier = 'First Teamer';
        else if (userProfile.coins >= 20) newTier = 'Academy Prospect';
        else if (userProfile.coins >= 10) newTier = 'Local Hero';

        if (newTier !== userProfile.tier) {
            await this.updateUserProfile(userId, { tier: newTier });
        }
    }

    // Get children for a family account
    async getChildren(parentUid: string): Promise<ChildProfile[]> {
        const snapshot = await this.usersCollection.doc(parentUid).collection('children').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChildProfile));
    }

    // Real-time children listener
    getChildrenListener(parentUid: string, callback: (children: ChildProfile[]) => void) {
        return this.usersCollection.doc(parentUid).collection('children').onSnapshot(snapshot => {
            const children = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChildProfile));
            callback(children);
        });
    }

    // Real-time approvals listener
    getApprovalsListener(parentUid: string, callback: (approvals: any[]) => void) {
        return this.usersCollection.doc(parentUid).collection('approvals').where('status', '==', 'pending').onSnapshot(snapshot => {
            const approvals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(approvals);
        });
    }

    // Action an approval request
    async actionApproval(parentUid: string, approvalId: string, status: 'approved' | 'rejected') {
        const docRef = this.usersCollection.doc(parentUid).collection('approvals').doc(approvalId);
        await docRef.update({
            status,
            updatedAt: firestore.FieldValue.serverTimestamp()
        });

        const doc = await docRef.get();
        const data = doc.data();
        if (data?.type === 'video' && data?.metadata?.postId) {
            await db.collection('posts').doc(data.metadata.postId).update({
                status: status === 'approved' ? 'active' : 'rejected'
            });
        }
    }

    // Add child with safety defaults
    async addChildProfile(parentUid: string, data: Partial<ChildProfile>): Promise<string> {
        const childRef = await this.usersCollection.doc(parentUid).collection('children').add({
            firstName: data.firstName || '',
            displayName: data.displayName || '',
            dob: data.dob || '',
            favTeam: data.favTeam || '',
            ageTier: 'junior_baller',
            avatar: data.avatar || '',
            coins: 0,

            // STRICT Safety Defaults
            isPrivate: true,
            commentsDisabled: true,
            dmsRedirectedToParent: true,
            restrictedSocial: true,
            screenTimeLimit: 60,
            bedtimeModeEnabled: true,
            dailySpendingLimit: 50,

            createdAt: new Date().toISOString()
        });
        return childRef.id;
    }

    // Request Approval for a purchase or action
    async requestApproval(userId: string, type: 'video' | 'purchase' | 'squad', metadata: any) {
        const user = await this.getUserProfile(userId);
        if (!user || user.accountType !== 'family' || !user.parentUid) {
            throw new Error('No parent account linked for approval.');
        }

        return this.usersCollection.doc(user.parentUid).collection('approvals').add({
            userId,
            childName: user.displayName || user.username,
            type,
            title: metadata.title || `Request for ${type}`,
            thumbnail: metadata.image || 'https://via.placeholder.com/150',
            status: 'pending',
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString()
            },
            createdAt: firestore.FieldValue.serverTimestamp()
        });
    }

    // Switch active profile
    async switchActiveProfile(parentUid: string, childId: string | null): Promise<void> {
        await this.updateUserProfile(parentUid, { activeProfileId: childId || (null as any) });
    }

    // FOLLOW LOGIC
    async followUser(followerId: string, followingId: string): Promise<void> {
        if (followerId === followingId) return;

        const followRef = db.collection('following').doc(`${followerId}_${followingId}`);
        const doc = await followRef.get();
        if (doc.exists) return; // Already following

        await followRef.set({
            followerId,
            followingId,
            createdAt: firestore.FieldValue.serverTimestamp()
        });

        // Update counts
        await this.usersCollection.doc(followerId).update({
            following: firestore.FieldValue.increment(1)
        });
        await this.usersCollection.doc(followingId).update({
            followers: firestore.FieldValue.increment(1)
        });
    }

    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        const followRef = db.collection('following').doc(`${followerId}_${followingId}`);
        const doc = await followRef.get();
        if (!doc.exists) return;

        await followRef.delete();

        // Update counts
        await this.usersCollection.doc(followerId).update({
            following: firestore.FieldValue.increment(-1)
        });
        await this.usersCollection.doc(followingId).update({
            followers: firestore.FieldValue.increment(-1)
        });
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const followRef = db.collection('following').doc(`${followerId}_${followingId}`);
        const doc = await followRef.get();
        return doc.exists;
    }

    // SEARCH LOGIC
    async searchUsers(query: string): Promise<UserProfile[]> {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();

        const snapshot = await this.usersCollection
            .where('username', '>=', lowerQuery)
            .where('username', '<=', lowerQuery + '\uf8ff')
            .limit(10)
            .get();

        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    }
}

export default new UserService();
