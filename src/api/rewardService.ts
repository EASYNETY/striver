import { db, firebaseAuth } from '../api/firebase';
import firestore from '@react-native-firebase/firestore';
import userService, { RewardTier } from './userService';

export interface DailyTask {
    id: string;
    title: string;
    description: string;
    reward: number;
    targetCount: number;
    type: 'login' | 'watch_videos' | 'post_response' | 'join_squad' | 'like_posts' | 'streak_7';
    isMilestone?: boolean;
}

export interface UserTaskProgress {
    taskId: string;
    currentCount: number;
    completed: boolean;
    lastUpdated: Date;
}

export interface TierBenefit {
    tier: RewardTier;
    minCoins: number;
    benefits: string[];
    color: string;
}

const TIER_BENEFITS: TierBenefit[] = [
    {
        tier: 'Future Star',
        minCoins: 0,
        benefits: ['Access to basic features', 'Join public squads', 'Earn coins'],
        color: '#A8F6BD', // Mint Green
    },
    {
        tier: 'Local Hero',
        minCoins: 100,
        benefits: ['Unlock digital stickers', 'Profile badge upgrade'],
        color: '#80DEEA', // Cyan
    },
    {
        tier: 'Academy Prospect',
        minCoins: 250,
        benefits: ['Create first squad', 'Access to general leaderboards'],
        color: '#CD7F32', // Bronze
    },
    {
        tier: 'First Teamer',
        minCoins: 500,
        benefits: ['Unlock video replies', 'Silver profile border'],
        color: '#C0C0C0', // Silver
    },
    {
        tier: 'Captain',
        minCoins: 1000,
        benefits: ['Create up to 3 squads', 'Gold profile border', 'Priority support'],
        color: '#FFD700', // Gold
    },
    {
        tier: 'MVP',
        minCoins: 2500,
        benefits: ['Verified status', 'Host public challenges'],
        color: '#E6E6FA', // Lavender
    },
    {
        tier: 'Elite',
        minCoins: 5000,
        benefits: ['Featured on discovery', 'Elite badge'],
        color: '#F08080', // Light Coral
    },
    {
        tier: 'Legend',
        minCoins: 10000,
        benefits: ['Monetization unlocked', 'Legendary status'],
        color: '#E5E4E2', // Platinum
    },
    {
        tier: 'Icon',
        minCoins: 25000,
        benefits: ['Direct line to support', 'Iconic profile theme'],
        color: '#B9F2FF', // Diamond Blue
    },
    {
        tier: 'GOAT',
        minCoins: 50000,
        benefits: ['The ultimate status', 'Hall of Fame entry', 'Exclusive GOAT merchandise'],
        color: '#F7E9A0', // Special Gold
    },
];

const DAILY_TASKS: DailyTask[] = [
    {
        id: 'daily_login',
        title: 'Daily Check-in',
        description: 'Log in to the app',
        reward: 5,
        targetCount: 1,
        type: 'login',
    },
    {
        id: 'watch_5_videos',
        title: 'Watch 5 Videos',
        description: 'Learn from the community',
        reward: 10,
        targetCount: 5,
        type: 'watch_videos',
    },
    {
        id: 'post_response',
        title: 'Post a Response',
        description: 'Engage with a challenge',
        reward: 15,
        targetCount: 1,
        type: 'post_response',
    },
];

const MILESTONE_TASKS: DailyTask[] = [
    {
        id: 'milestone_first_video',
        title: 'First Video',
        description: 'Post your first video',
        reward: 50,
        targetCount: 1,
        type: 'post_response',
        isMilestone: true,
    },
    {
        id: 'milestone_100_followers',
        title: 'Community Builder',
        description: 'Reach 100 followers',
        reward: 100,
        targetCount: 100,
        type: 'login', // Placeholder type
        isMilestone: true,
    },
    {
        id: 'milestone_1000_views',
        title: 'Going Viral',
        description: 'Get 1,000 total views',
        reward: 75,
        targetCount: 1000,
        type: 'login', // Placeholder type
        isMilestone: true,
    }
];

class RewardService {
    private tasksCollection = db.collection('dailyTasks');
    private userTasksCollection = db.collection('userTasks');
    private transactionsCollection = db.collection('coinTransactions');

    // Get daily tasks
    getDailyTasks(): DailyTask[] {
        return DAILY_TASKS;
    }

    // Get milestone tasks
    getMilestoneTasks(): DailyTask[] {
        return MILESTONE_TASKS;
    }

    // Get tier benefits
    getTierBenefits(): TierBenefit[] {
        return TIER_BENEFITS;
    }

    // Get user's task progress for today
    async getUserTaskProgress(): Promise<UserTaskProgress[]> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const snapshot = await this.userTasksCollection
            .where('userId', '==', currentUser.uid)
            .where('date', '==', today.toISOString().split('T')[0])
            .get();

        return snapshot.docs.map(doc => doc.data()) as UserTaskProgress[];
    }

    // Update task progress
    async updateTaskProgress(taskId: string, increment: number = 1): Promise<void> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        const today = new Date().toISOString().split('T')[0];
        const docId = `${currentUser.uid}_${taskId}_${today}`;

        const task = DAILY_TASKS.find(t => t.id === taskId) || MILESTONE_TASKS.find(t => t.id === taskId);
        if (!task) return;

        const docRef = this.userTasksCollection.doc(docId);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data() as UserTaskProgress;
            if (data.completed) return; // Already completed

            const newCount = data.currentCount + increment;
            const completed = newCount >= task.targetCount;

            await docRef.update({
                currentCount: newCount,
                completed,
                lastUpdated: firestore.FieldValue.serverTimestamp(),
            });

            if (completed) {
                await this.awardCoins(currentUser.uid, task.reward, `Completed: ${task.title}`);
            }
        } else {
            const completed = increment >= task.targetCount;

            await docRef.set({
                userId: currentUser.uid,
                taskId,
                date: today,
                currentCount: increment,
                completed,
                lastUpdated: firestore.FieldValue.serverTimestamp(),
            });

            if (completed) {
                await this.awardCoins(currentUser.uid, task.reward, `Completed: ${task.title}`);
            }
        }
    }

    // Award coins to user
    async awardCoins(userId: string, amount: number, reason: string): Promise<void> {
        await userService.addCoins(userId, amount);

        // Log transaction
        await this.transactionsCollection.add({
            userId,
            amount,
            type: 'earn',
            reason,
            timestamp: firestore.FieldValue.serverTimestamp(),
        });

        // Update tier if necessary
        await this.updateUserTier(userId);
    }

    // Deduct coins from user
    async deductCoins(userId: string, amount: number, reason: string): Promise<void> {
        await userService.deductCoins(userId, amount);

        await this.transactionsCollection.add({
            userId,
            amount: -amount,
            type: 'spend',
            reason,
            timestamp: firestore.FieldValue.serverTimestamp(),
        });

        // Tier usually doesn't downgrade on spend, but if requirements assume "current balance", we might check
        // Assuming "Total Earned" vs "Current Balance" - standard gamification usually uses Total Earned for Tiers
        // BUT current request implies "Coins needed for next tier", which suggests Balance.
        // Let's stick to Balance for now as implied by standard logic in the file.
        await this.updateUserTier(userId);
    }

    // Update user tier based on coins
    private async updateUserTier(userId: string): Promise<void> {
        const userProfile = await userService.getUserProfile(userId);
        if (!userProfile) return;

        const coins = userProfile.coins;

        // Find the highest tier the user qualifies for
        let newTier: RewardTier = 'Future Star';
        for (let i = TIER_BENEFITS.length - 1; i >= 0; i--) {
            if (coins >= TIER_BENEFITS[i].minCoins) {
                newTier = TIER_BENEFITS[i].tier;
                break;
            }
        }

        if (newTier !== userProfile.tier) {
            await userService.updateUserProfile(userId, { tier: newTier });
        }
    }

    // Get user's total spend for today
    async getDailySpend(userId: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const snapshot = await this.transactionsCollection
            .where('userId', '==', userId)
            .where('type', '==', 'spend')
            .where('timestamp', '>=', today)
            .get();

        let total = 0;
        snapshot.docs.forEach(doc => {
            const data = doc.data() as any;
            total += Math.abs(data.amount || 0);
        });
        return total;
    }

    // Get coin transaction history
    async getCoinTransactions(limit: number = 50): Promise<any[]> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return [];

        const snapshot = await this.transactionsCollection
            .where('userId', '==', currentUser.uid)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    }

    // Calculate tier progress
    getTierProgress(coins: number): {
        currentTier: TierBenefit;
        nextTier: TierBenefit | null;
        progress: number;
    } {
        let currentTier = TIER_BENEFITS[0];
        let nextTier: TierBenefit | null = null;

        for (let i = TIER_BENEFITS.length - 1; i >= 0; i--) {
            if (coins >= TIER_BENEFITS[i].minCoins) {
                currentTier = TIER_BENEFITS[i];
                nextTier = i < TIER_BENEFITS.length - 1 ? TIER_BENEFITS[i + 1] : null;
                break;
            }
        }

        let progress = 0;
        if (nextTier) {
            const coinsNeeded = nextTier.minCoins - currentTier.minCoins;
            const coinsEarned = coins - currentTier.minCoins;
            progress = (coinsEarned / coinsNeeded) * 100;
        } else {
            progress = 100; // Max tier reached
        }

        return { currentTier, nextTier, progress };
    }
}

export default new RewardService();
