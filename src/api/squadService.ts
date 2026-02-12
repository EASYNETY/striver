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
    orderBy,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    FieldValue
} from '@react-native-firebase/firestore';
import userService from './userService';

export interface Squad {
    id: string;
    name: string;
    description: string;
    image: string;
    creatorId: string;
    members: string[];
    memberCount: number;
    isPrivate: boolean;
    isPremium?: boolean;
    capacity: number;
    kudosCost?: number;
    inviteCode?: string;
    tags?: string[];
    rules?: string;
    price?: string;
    ageRestriction: 'all' | '13+' | '18+';
    createdAt: any;
}

class SquadService {
    private squadsCollection = collection(modularDb, 'squads');
    private squadMembersCollection = collection(modularDb, 'squadMembers');

    // Create a new squad
    async createSquad(data: {
        name: string;
        description: string;
        imageUri?: string;
        isPrivate?: boolean;
        capacity?: number;
        kudosCost?: number;
        ageRestriction?: 'all' | '13+' | '18+';
    }): Promise<string> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        let imageUrl = '';
        if (data.imageUri) {
            if (data.imageUri.startsWith('http')) {
                imageUrl = data.imageUri;
            } else {
                imageUrl = await this.uploadSquadImage(data.imageUri);
            }
        }

        const inviteCode = this.generateInviteCode();

        const squadData = {
            name: data.name,
            description: data.description,
            image: imageUrl,
            creatorId: currentUser.uid,
            members: [currentUser.uid],
            memberCount: 1,
            isPrivate: data.isPrivate || false,
            capacity: data.capacity || 50,
            kudosCost: data.kudosCost || 0,
            ageRestriction: data.ageRestriction || 'all',
            inviteCode,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(this.squadsCollection, squadData);

        // Add creator as first member
        await addDoc(this.squadMembersCollection, {
            squadId: docRef.id,
            userId: currentUser.uid,
            role: 'owner',
            joinedAt: serverTimestamp(),
        });

        return docRef.id;
    }

    // Get all squads
    async getAllSquads(): Promise<Squad[]> {
        const q = query(this.squadsCollection, orderBy('memberCount', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Squad[];
    }

    // Get user's squads
    async getUserSquads(userId: string): Promise<Squad[]> {
        const q = query(this.squadsCollection, where('members', 'array-contains', userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Squad[];
    }

    // Get count of squads owned by user
    async getOwnedSquadsCount(userId: string): Promise<number> {
        const q = query(this.squadsCollection, where('creatorId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.size;
    }

    // Get squad by ID
    async getSquad(squadId: string): Promise<Squad | null> {
        const docSnap = await getDoc(doc(this.squadsCollection, squadId));
        if (!docSnap.exists) return null;

        return { id: docSnap.id, ...docSnap.data() } as Squad;
    }

    // Join a squad
    async joinSquad(squadId: string): Promise<void> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        // Check if already a member
        const isMember = await this.isMember(squadId, currentUser.uid);
        if (isMember) {
            throw new Error('Already a member of this squad');
        }

        try {
            await updateDoc(doc(this.squadsCollection, squadId), {
                members: arrayUnion(currentUser.uid),
                memberCount: increment(1),
            });

            await addDoc(this.squadMembersCollection, {
                squadId,
                userId: currentUser.uid,
                role: 'member',
                joinedAt: serverTimestamp(),
            });
        } catch (error: any) {
            console.error('[SquadService] Join error:', error);
            if (error.code === 'permission-denied') {
                throw new Error('Permission denied. Check your account permissions.');
            }
            throw error;
        }
    }

    // Leave a squad
    async leaveSquad(squadId: string): Promise<void> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        await updateDoc(doc(this.squadsCollection, squadId), {
            members: arrayRemove(currentUser.uid),
            memberCount: increment(-1),
        });

        // Remove member record
        const q = query(
            this.squadMembersCollection,
            where('squadId', '==', squadId),
            where('userId', '==', currentUser.uid)
        );
        const memberSnapshot = await getDocs(q);

        for (const doc of memberSnapshot.docs) {
            await deleteDoc(doc.ref);
        }
    }

    // Join squad with invite code
    async joinSquadWithCode(inviteCode: string): Promise<string> {
        const q = query(this.squadsCollection, where('inviteCode', '==', inviteCode), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error('Invalid invite code');
        }

        const squadId = snapshot.docs[0].id;
        await this.joinSquad(squadId);

        return squadId;
    }

    // Check if user is member of squad
    async isMember(squadId: string, userId: string): Promise<boolean> {
        const docSnap = await getDoc(doc(this.squadsCollection, squadId));
        if (!docSnap.exists) return false;

        const squad = docSnap.data() as Squad;
        return squad.members.includes(userId);
    }

    // Check if user can join squad based on age restriction
    async canJoinSquad(squadId: string, userId: string): Promise<{ canJoin: boolean; reason?: string }> {
        const squad = await this.getSquad(squadId);
        if (!squad) return { canJoin: false, reason: 'Squad not found' };

        const userProfile = await userService.getUserProfile(userId);
        if (!userProfile) return { canJoin: false, reason: 'User profile not found' };

        // Check age restriction
        if (squad.ageRestriction === '18+') {
            if (userProfile.ageTier === 'junior_baller' || userProfile.ageTier === 'academy_prospect') {
                return { canJoin: false, reason: 'This squad is restricted to users 18 and older' };
            }
        } else if (squad.ageRestriction === '13+') {
            if (userProfile.ageTier === 'junior_baller') {
                return { canJoin: false, reason: 'This squad is restricted to users 13 and older' };
            }
        }

        // Check if already a member
        if (squad.members.includes(userId)) {
            return { canJoin: false, reason: 'Already a member' };
        }

        // Check capacity
        if (squad.memberCount >= squad.capacity) {
            return { canJoin: false, reason: 'Squad is at full capacity' };
        }

        return { canJoin: true };
    }

    // Upload squad image
    private async uploadSquadImage(imageUri: string): Promise<string> {
        const filename = `squads/${Date.now()}.jpg`;
        const reference = firebaseStorage.ref(filename);

        await reference.putFile(imageUri);
        return await reference.getDownloadURL();
    }

    // Update squad details (Admin/Creator only)
    async updateSquad(squadId: string, data: Partial<Squad> & { imageUri?: string }): Promise<void> {
        let updateData: any = { ...data };

        if (data.imageUri) {
            delete updateData.imageUri;
            if (data.imageUri.startsWith('http')) {
                updateData.image = data.imageUri;
            } else {
                updateData.image = await this.uploadSquadImage(data.imageUri);
            }
        }

        await updateDoc(doc(this.squadsCollection, squadId), {
            ...updateData,
            updatedAt: serverTimestamp(),
        });
    }

    // Get members of a squad
    async getSquadMembers(squadId: string): Promise<any[]> {
        const q = query(this.squadMembersCollection, where('squadId', '==', squadId));
        const snapshot = await getDocs(q);

        const memberData = snapshot.docs.map(doc => doc.data());

        // Fetch user profiles for all members
        const memberInfoPromises = memberData.map(async (m) => {
            const profile = await userService.getUserProfile(m.userId);
            return {
                ...m,
                username: profile?.username || 'Striver Member',
                avatar: profile?.avatar || '',
                career_tier_id: profile?.career_tier_id || 'future_star'
            };
        });

        return Promise.all(memberInfoPromises);
    }

    // Create a squad challenge
    async createChallenge(squadId: string, data: { title: string, description: string, reward: number, durationDays: number }): Promise<string> {
        const docRef = await addDoc(collection(modularDb, 'squadChallenges'), {
            squadId,
            ...data,
            isActive: true,
            participantCount: 0,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    }

    // Get squad challenges
    async getSquadChallenges(squadId: string): Promise<any[]> {
        const q = query(collection(modularDb, 'squadChallenges'), where('squadId', '==', squadId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Get squad leaderboard
    async getSquadLeaderboard(squadId: string): Promise<any[]> {
        const q = query(this.squadMembersCollection, where('squadId', '==', squadId));
        const snapshot = await getDocs(q);

        const memberData = snapshot.docs.map(doc => doc.data());

        const leaderboard = await Promise.all(memberData.map(async (m) => {
            const profile = await userService.getUserProfile(m.userId);
            return {
                userId: m.userId,
                username: profile?.username || 'Striver Member',
                avatar: profile?.avatar || '',
                coins: profile?.coins || 0
            };
        }));

        return leaderboard.sort((a, b) => b.coins - a.coins);
    }

    // Generate random invite code
    private generateInviteCode(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Subscribe to squad updates
    subscribeToSquad(squadId: string, callback: (squad: Squad | null) => void): () => void {
        return onSnapshot(doc(this.squadsCollection, squadId), docSnap => {
            if (docSnap.exists) {
                callback({ id: docSnap.id, ...docSnap.data() } as Squad);
            } else {
                callback(null);
            }
        });
    }
}

export default new SquadService();
