import { db, firebaseAuth, firebaseStorage } from '../api/firebase';
import firestore from '@react-native-firebase/firestore';
import userService from './userService';

export interface Squad {
    id: string;
    name: string;
    description: string;
    image: string;
    creatorId: string;
    members: string[];
    memberCount: number;
    isPremium: boolean;
    price?: string;
    isPrivate: boolean; // Invite only
    capacity: number;
    kudosCost?: number; // Cost to join in Kudos
    inviteCode?: string;
    tags?: string[];
    rules?: string;
    premiumBenefits?: string[];
    createdAt: Date;
}

class SquadService {
    private squadsCollection = db.collection('squads');
    private squadMembersCollection = db.collection('squadMembers');

    // Create a new squad
    async createSquad(data: {
        name: string;
        description: string;
        imageUri?: string;
        isPremium?: boolean;
        price?: string;
        isPrivate?: boolean;
        capacity?: number;
        kudosCost?: number;
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
            isPremium: data.isPremium || false,
            price: data.price || '',
            isPrivate: data.isPrivate || false,
            capacity: data.capacity || 50, // Default capacity
            kudosCost: data.kudosCost || 0,
            inviteCode,
            createdAt: firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await this.squadsCollection.add(squadData);

        // Add creator as first member
        await this.squadMembersCollection.add({
            squadId: docRef.id,
            userId: currentUser.uid,
            role: 'owner', // Creator is owner
            joinedAt: firestore.FieldValue.serverTimestamp(),
        });

        return docRef.id;
    }

    // Get all squads
    async getAllSquads(): Promise<Squad[]> {
        const snapshot = await this.squadsCollection
            .orderBy('memberCount', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Squad[];
    }

    // Get user's squads
    async getUserSquads(userId: string): Promise<Squad[]> {
        const snapshot = await this.squadsCollection
            .where('members', 'array-contains', userId)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Squad[];
    }

    // Get count of squads owned by user
    async getOwnedSquadsCount(userId: string): Promise<number> {
        const snapshot = await this.squadsCollection
            .where('creatorId', '==', userId)
            .get();
        return snapshot.size;
    }

    // Get squad by ID
    async getSquad(squadId: string): Promise<Squad | null> {
        const doc = await this.squadsCollection.doc(squadId).get();
        if (!doc.exists) return null;

        return { id: doc.id, ...doc.data() } as Squad;
    }

    // Join a squad
    async joinSquad(squadId: string): Promise<void> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        await this.squadsCollection.doc(squadId).update({
            members: firestore.FieldValue.arrayUnion(currentUser.uid),
            memberCount: firestore.FieldValue.increment(1),
        });

        await this.squadMembersCollection.add({
            squadId,
            userId: currentUser.uid,
            role: 'member',
            joinedAt: firestore.FieldValue.serverTimestamp(),
        });
    }

    // Leave a squad
    async leaveSquad(squadId: string): Promise<void> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        await this.squadsCollection.doc(squadId).update({
            members: firestore.FieldValue.arrayRemove(currentUser.uid),
            memberCount: firestore.FieldValue.increment(-1),
        });

        // Remove member record
        const memberSnapshot = await this.squadMembersCollection
            .where('squadId', '==', squadId)
            .where('userId', '==', currentUser.uid)
            .get();

        memberSnapshot.docs.forEach(doc => doc.ref.delete());
    }

    // Join squad with invite code
    async joinSquadWithCode(inviteCode: string): Promise<string> {
        const snapshot = await this.squadsCollection
            .where('inviteCode', '==', inviteCode)
            .limit(1)
            .get();

        if (snapshot.empty) {
            throw new Error('Invalid invite code');
        }

        const squadId = snapshot.docs[0].id;
        await this.joinSquad(squadId);

        return squadId;
    }

    // Check if user is member of squad
    async isMember(squadId: string, userId: string): Promise<boolean> {
        const doc = await this.squadsCollection.doc(squadId).get();
        if (!doc.exists) return false;

        const squad = doc.data() as Squad;
        return squad.members.includes(userId);
    }

    // Upload squad image
    private async uploadSquadImage(imageUri: string): Promise<string> {
        const filename = `squads/${Date.now()}.jpg`;
        const reference = firebaseStorage.ref(filename);

        await reference.putFile(imageUri);
        return await reference.getDownloadURL();
    }

    // Update squad details (Admin/Creator only)
    async updateSquad(squadId: string, data: Partial<Squad>): Promise<void> {
        await this.squadsCollection.doc(squadId).update({
            ...data,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    }

    // Get members of a squad
    async getSquadMembers(squadId: string): Promise<any[]> {
        const snapshot = await this.squadMembersCollection
            .where('squadId', '==', squadId)
            .get();

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
        const docRef = await db.collection('squadChallenges').add({
            squadId,
            ...data,
            isActive: true,
            participantCount: 0,
            createdAt: firestore.FieldValue.serverTimestamp(),
        });
        return docRef.id;
    }

    // Get squad challenges
    async getSquadChallenges(squadId: string): Promise<any[]> {
        const snapshot = await db.collection('squadChallenges')
            .where('squadId', '==', squadId)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Get squad leaderboard
    async getSquadLeaderboard(squadId: string): Promise<any[]> {
        const snapshot = await this.squadMembersCollection
            .where('squadId', '==', squadId)
            .get();

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
        return this.squadsCollection.doc(squadId).onSnapshot(doc => {
            if (doc.exists) {
                callback({ id: doc.id, ...doc.data() } as Squad);
            } else {
                callback(null);
            }
        });
    }
}

export default new SquadService();
