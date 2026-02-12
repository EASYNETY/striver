import { db, modularDb, firebaseAuth, firebaseStorage } from '../api/firebase';
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
    Timestamp,
    increment,
    serverTimestamp,
    FieldValue
} from '@react-native-firebase/firestore';

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
    favoriteTeam?: string;

    // Striver Specifics
    accountType: AccountType;
    ageTier: AgeTier;
    dob?: string;
    isPrivate?: boolean;

    career_earnings: number;
    career_tier_id: string; // future_star, academy, etc.
    badge_status: string; // bronze, silver, gold, etc.
    coins: number;
    followers: number;
    following: number;
    replies: number;
    onboardingComplete?: boolean;

    // Family Specifics
    activeProfileId?: string; // Currently switched to this child profile (if family)
    parentUid?: string;

    // Verification
    verification_photo?: string;
    parentPictureVerified?: boolean;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    ageVerificationStatus?: 'unverified' | 'verified' | 'rejected';
    ageVerificationDate?: any;
    profileStatus?: {
        ageVerification?: string;
        verificationStartedAt?: any;
        verificationCompletedAt?: any;
        verificationMethod?: string;
    };
    profileCompletion?: number;

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
    private usersCollection = collection(modularDb, 'users');

    // Get current user profile
    async getCurrentUserProfile(): Promise<UserProfile | null> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return null;

        try {
            const userDocRef = doc(modularDb, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists) {
                // Auto-create profile if missing
                const defaultProfile = {
                    username: currentUser.email?.split('@')[0] || `user_${currentUser.uid.substring(0, 8)}`,
                    email: currentUser.email || '',
                    displayName: currentUser.displayName || '',
                    bio: '',
                    avatar: currentUser.photoURL || '',
                    accountType: 'individual' as const,
                    ageTier: 'academy_prospect' as const,
                    career_earnings: 0,
                    career_tier_id: 'future_star',
                    badge_status: 'bronze',
                    coins: 0,
                    followers: 0,
                    following: 0,
                    replies: 0,
                    onboardingComplete: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                };

                await setDoc(userDocRef, defaultProfile);
                return { uid: currentUser.uid, ...defaultProfile } as unknown as UserProfile;
            }

            const data = userDocSnap.data() as any;
            return {
                uid: userDocSnap.id,
                accountType: data.accountType || 'individual',
                ageTier: data.ageTier || 'academy_prospect',
                career_tier_id: data.career_tier_id || 'future_star',
                badge_status: data.badge_status || 'bronze',
                coins: data.coins || 0,
                onboardingComplete: data.onboardingComplete ?? false,
                ...data
            } as UserProfile;
        } catch (error) {
            console.error("Error in getCurrentUserProfile:", error);
            return null;
        }
    }

    // Get user profile by ID
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        if (!uid) return null;
        try {
            const userDocRef = doc(modularDb, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists) return null;

            return { uid: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
        } catch (error) {
            console.error("Error getting user profile:", error, "for uid:", uid);
            return null;
        }
    }

    // Real-time profile listener
    onProfileChange(uid: string, callback: (profile: UserProfile | null) => void) {
        if (!uid) {
            callback(null);
            return () => { };
        }
        return onSnapshot(doc(modularDb, 'users', uid),
            (snapshot) => {
                if (snapshot.exists) {
                    callback({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
                } else {
                    callback(null);
                }
            },
            (error) => {
                console.error("Error listening to profile:", error, "for uid:", uid);
                // CRUCIAL: Call callback with null on error so the app doesn't hang on splash
                callback(null);
            }
        );
    }

    subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
        return this.onProfileChange(uid, callback);
    }

    // Create user profile (called after signup)
    async createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
        await setDoc(doc(this.usersCollection, uid), {
            username: data.username || `user_${uid.substring(0, 8)}`,
            email: data.email || '',
            displayName: data.displayName || '',
            bio: data.bio || '',
            avatar: data.avatar || '',
            accountType: data.accountType || 'individual',
            ageTier: data.ageTier || 'academy_prospect',
            career_tier_id: 'future_star',
            badge_status: 'bronze',
            career_earnings: 0,
            coins: 0,

            followers: 0,
            following: 0,
            replies: 0,
            onboardingComplete: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
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

        await updateDoc(doc(this.usersCollection, uid), {
            ...cleanData,
            updatedAt: serverTimestamp(),
        });
    }

    // Add coins to user
    async addCoins(uid: string, amount: number): Promise<void> {
        await updateDoc(doc(this.usersCollection, uid), {
            coins: increment(amount),
        });
    }

    // Deduct coins from user
    async deductCoins(uid: string, amount: number): Promise<void> {
        await updateDoc(doc(this.usersCollection, uid), {
            coins: increment(-amount),
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
        // Ensure path is safe for both iOS and Android if needed, but RNFB usually handles it.
        const reference = firebaseStorage.ref(`verification_photos/${uid}_${timestamp}.jpg`);
        await reference.putFile(fileUri);
        const url = await reference.getDownloadURL();
        return url;
    }

    // Update user's reward tier based on activity/coins (example logic)
    async updateRewardTier(_userId: string): Promise<void> {
        // Redundant with RewardService, keeping skeleton for now
        // RewardService.checkAndUpgradeTier(userId) handles this.
    }

    // Get children for a family account
    async getChildren(parentUid: string): Promise<ChildProfile[]> {
        const snapshot = await getDocs(collection(doc(this.usersCollection, parentUid), 'children'));
        return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ChildProfile));
    }

    // Real-time children listener
    getChildrenListener(parentUid: string, callback: (children: ChildProfile[]) => void) {
        return onSnapshot(collection(doc(this.usersCollection, parentUid), 'children'), snapshot => {
            if (!snapshot) {
                console.warn('Children snapshot is null');
                callback([]);
                return;
            }
            const children = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ChildProfile));
            callback(children);
        }, error => {
            console.error('Children listener error:', error);
            callback([]);
        });
    }

    // Real-time approvals listener
    getApprovalsListener(parentUid: string, callback: (approvals: any[]) => void) {
        const approvalsQuery = query(
            collection(doc(this.usersCollection, parentUid), 'approvals'),
            where('status', '==', 'pending')
        );
        return onSnapshot(approvalsQuery, snapshot => {
            if (!snapshot) {
                console.warn('Approvals snapshot is null');
                callback([]);
                return;
            }
            const approvals = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            callback(approvals);
        }, error => {
            console.error('Approvals listener error:', error);
            callback([]);
        });
    }

    // Action an approval request
    async actionApproval(parentUid: string, approvalId: string, status: 'approved' | 'rejected') {
        const approvalDocRef = doc(collection(doc(this.usersCollection, parentUid), 'approvals'), approvalId);
        await updateDoc(approvalDocRef, {
            status,
            updatedAt: serverTimestamp()
        });
        const approvalDocSnap = await getDoc(approvalDocRef);
        if (approvalDocSnap.exists) {
            const data = approvalDocSnap.data();
            if (data?.type === 'video' && data?.metadata?.postId) {
                await updateDoc(doc(modularDb, 'posts', data.metadata.postId), {
                    status: status === 'approved' ? 'active' : 'rejected'
                });
            }
        }
    }

    // Add child with safety defaults
    async addChildProfile(parentUid: string, data: Partial<ChildProfile>): Promise<string> {
        // Validate parent can add children
        const parentProfile = await this.getUserProfile(parentUid);
        if (!parentProfile) {
            throw new Error('Parent profile not found');
        }

        if (parentProfile.accountType !== 'family') {
            throw new Error('Only family accounts can add child profiles');
        }

        // Check if parent is verified (18+)
        if (parentProfile.ageVerificationStatus !== 'verified') {
            throw new Error('Parent must complete age verification before adding children');
        }

        // Check child limit (max 5)
        const existingChildren = await this.getChildren(parentUid);
        if (existingChildren.length >= 5) {
            throw new Error('Maximum of 5 child profiles allowed');
        }

        // Validate child age (must be under 13)
        if (data.dob) {
            const age = this.calculateAge(data.dob);
            if (age >= 13) {
                throw new Error('Child profiles are only for children under 13. Users 13+ should create their own account.');
            }
        }

        const childRef = await addDoc(collection(doc(this.usersCollection, parentUid), 'children'), {
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

    // Helper to calculate age
    private calculateAge(dob: string): number {
        const parts = dob.split('/');
        if (parts.length !== 3) return -1;

        const birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    }

    // Request Approval for a purchase or action
    async requestApproval(userId: string, type: 'video' | 'purchase' | 'squad', metadata: any) {
        const user = await this.getUserProfile(userId);
        if (!user || user.accountType !== 'family' || !user.parentUid) {
            throw new Error('No parent account linked for approval.');
        }

        return addDoc(collection(doc(this.usersCollection, user.parentUid), 'approvals'), {
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
            createdAt: serverTimestamp()
        });
    }

    // Create mock approval request (for testing)
    async createMockApprovalRequest(parentUid: string, childName: string) {
        return addDoc(collection(doc(this.usersCollection, parentUid), 'approvals'), {
            userId: 'mock_child_id',
            childName: childName,
            type: 'video',
            title: 'New video upload: "My Soccer Skills"',
            thumbnail: 'https://via.placeholder.com/150',
            status: 'pending',
            metadata: {
                videoId: 'mock_video_123',
                duration: 45,
                timestamp: new Date().toISOString()
            },
            createdAt: serverTimestamp()
        });
    }

    // Switch active profile
    async switchActiveProfile(parentUid: string, childId: string | null): Promise<void> {
        await this.updateUserProfile(parentUid, { activeProfileId: childId || (null as any) });
    }

    // FOLLOW LOGIC
    async followUser(followerId: string, followingId: string): Promise<void> {
        if (followerId === followingId) return;

        const followRef = doc(modularDb, 'following', `${followerId}_${followingId}`);
        const snapshot = await getDoc(followRef);
        if (snapshot.exists) return; // Already following

        await setDoc(followRef, {
            followerId,
            followingId,
            createdAt: serverTimestamp()
        });

        // Update counts
        const followerDocRef = doc(modularDb, 'users', followerId);
        const followingDocRef = doc(modularDb, 'users', followingId);

        await updateDoc(followerDocRef, {
            following: increment(1)
        });
        await updateDoc(followingDocRef, {
            followers: increment(1)
        });
    }

    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        const followRef = doc(modularDb, 'following', `${followerId}_${followingId}`);
        const snapshot = await getDoc(followRef);
        if (!snapshot.exists) return;

        await deleteDoc(followRef);

        // Update counts
        const followerDocRef = doc(modularDb, 'users', followerId);
        const followingDocRef = doc(modularDb, 'users', followingId);

        await updateDoc(followerDocRef, {
            following: increment(-1)
        });
        await updateDoc(followingDocRef, {
            followers: increment(-1)
        });
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        if (!followerId || !followingId) return false;
        const followRef = doc(modularDb, 'following', `${followerId}_${followingId}`);
        const snapshot = await getDoc(followRef);
        return snapshot.exists;
    }

    // SEARCH LOGIC
    async searchUsers(queryStr: string): Promise<UserProfile[]> {
        if (!queryStr.trim()) return [];
        const lowerQuery = queryStr.toLowerCase();

        const usersQuery = query(
            this.usersCollection,
            where('username', '>=', lowerQuery),
            where('username', '<=', lowerQuery + '\uf8ff'),
            limit(10)
        );

        const snapshot = await getDocs(usersQuery);

        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    }
}

export default new UserService();
