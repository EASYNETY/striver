import { db, firebaseAuth } from '../api/firebase';

import firestore from '@react-native-firebase/firestore';
import { CAREER_TIERS, EARNING_RULES, SPENDING_RULES, BADGE_TIERS } from '../constants/rewards';
import { checkAgeTier } from '../utils/ageUtils';

export const RewardService = {
    // --- Earning Logic ---

    async awardCoins(userId: string, actionType: string, metadata: any = {}) {
        let amount = 0;

        // Determine amount based on action type
        switch (actionType) {
            case 'daily_login': amount = EARNING_RULES.daily.login; break;
            case 'watch_5_videos': amount = EARNING_RULES.daily.watch_5_videos; break;
            case 'post_response': amount = EARNING_RULES.daily.post_response; break;
            case 'complete_challenge': amount = EARNING_RULES.daily.complete_challenge; break;
            case 'milestone_first_video': amount = EARNING_RULES.milestones.first_video; break;
            case 'like_posts': amount = EARNING_RULES.daily.like_posts; break;
            case 'join_squad': amount = EARNING_RULES.weekly.join_squad; break;
            case 'participate_legend_challenge': amount = EARNING_RULES.weekly.participate_legend_challenge; break;
            default: console.warn('Unknown action type for rewards:', actionType); return;
        }

        if (amount > 0) {
            // Check if this daily reward was already claimed today (for tasks that should only pay once)
            if (['daily_login', 'watch_5_videos', 'post_response', 'complete_challenge'].includes(actionType)) {
                const today = new Date().toISOString().split('T')[0];
                const claimSnap = await db.collection('transactions')
                    .where('userId', '==', userId)
                    .where('actionType', '==', actionType)
                    .where('dateString', '==', today)
                    .get();

                if (!claimSnap.empty) {
                    console.log(`Reward ${actionType} already claimed today.`);
                    return;
                }
            }

            const userRef = db.collection('users').doc(userId);

            // Update User Balance & Total Career Earnings
            await userRef.update({
                coins: firestore.FieldValue.increment(amount),
                career_earnings: firestore.FieldValue.increment(amount),
                last_earned_date: firestore.FieldValue.serverTimestamp()
            });

            // Log Transaction
            await db.collection('transactions').add({
                userId,
                type: 'earn',
                actionType,
                amount,
                timestamp: firestore.FieldValue.serverTimestamp(),
                dateString: new Date().toISOString().split('T')[0],
                metadata
            });

            // Check for Tier Upgrade
            await this.checkAndUpgradeTier(userId);
        }
    },

    async trackActivity(userId: string, actionType: string, metadata: any = {}) {
        const today = new Date().toISOString().split('T')[0];
        const progressRef = db.collection('users').doc(userId).collection('daily_progress').doc(today);

        if (actionType === 'watch_video') {
            const videoId = metadata.postId;
            if (!videoId) return;

            // Use a transaction or simply check if this video was already watched today
            const doc = await progressRef.get();
            const data = doc.exists ? doc.data() : { watched_videos: [] };
            const watchedList = (data?.watched_videos || []) as string[];

            if (!watchedList.includes(videoId)) {
                const newWatchedList = [...watchedList, videoId];
                await progressRef.set({
                    watched_videos: newWatchedList,
                    watch_count: newWatchedList.length,
                    last_updated: firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                // If they reached 5 videos, award coins
                if (newWatchedList.length === 5) {
                    await this.awardCoins(userId, 'watch_5_videos');
                }
            }
        } else {
            // For single-step actions, we can still use awardCoins directly or wrap here
            await this.awardCoins(userId, actionType, metadata);
        }
    },

    async getDailyProgress(userId: string) {
        const today = new Date().toISOString().split('T')[0];
        const progressSnap = await db.collection('users').doc(userId).collection('daily_progress').doc(today).get();
        const data = progressSnap.exists ? progressSnap.data() : {};

        // Also check transaction history to see what's already claimed
        const claimSnap = await db.collection('transactions')
            .where('userId', '==', userId)
            .where('dateString', '==', today)
            .where('type', '==', 'earn')
            .get();

        const claimedActions = claimSnap.docs.map(doc => doc.data().actionType);

        return {
            watch_count: data?.watch_count || 0,
            claimedActions
        };
    },

    async checkAndUpgradeTier(userId: string) {
        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) return;

        const userData = userSnap.data() as any;
        const currentEarnings = userData.career_earnings || 0;
        const currentTierId = userData.career_tier_id || 'future_star';

        // Find the highest tier user qualifies for
        let newTier = CAREER_TIERS[0];
        for (let i = CAREER_TIERS.length - 1; i >= 0; i--) {
            if (currentEarnings >= CAREER_TIERS[i].threshold) {
                newTier = CAREER_TIERS[i];
                break;
            }
        }

        if (newTier.id !== currentTierId) {
            // Find badge status based on the new tier
            const badge = BADGE_TIERS.find(b => b.tierRange.includes(newTier.id))?.id || 'bronze';

            await userRef.update({
                career_tier_id: newTier.id,
                badge_status: badge
            });

            // Log Tier Achievement
            await db.collection('transactions').add({
                userId,
                type: 'earn',
                actionType: 'tier_up',
                amount: 0,
                metadata: {
                    tierId: newTier.id,
                    tierName: newTier.name
                },
                timestamp: firestore.FieldValue.serverTimestamp()
            });
        }
    },

    // --- Spending Logic ---

    async spendCoins(userId: string, item: any) {
        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error('User not found');

        const userData = userSnap.data() as any;
        const userCoins = userData.coins || 0;
        const userAgeTier = checkAgeTier(userData.dob);

        // 1. Check Balance
        if (userCoins < item.cost) {
            throw new Error('Insufficient coins');
        }

        // 2. Check Age Restrictions
        if (userAgeTier === 'junior_baller') {
            // a. Category Restriction
            if (!SPENDING_RULES.junior_baller.allowed_categories.includes(item.category)) {
                throw new Error('This item is not available for your account type.');
            }

            // b. Daily Spending Limit
            const today = new Date().toISOString().split('T')[0];
            const dailySpendSnap = await db.collection('transactions')
                .where('userId', '==', userId)
                .where('type', '==', 'spend')
                .where('dateString', '==', today)
                .get();

            let dayTotal = 0;
            dailySpendSnap.forEach(doc => {
                dayTotal += (doc.data().amount || 0);
            });

            if (dayTotal + item.cost > SPENDING_RULES.junior_baller.max_daily_spend) {
                throw new Error(`Daily spending limit of ${SPENDING_RULES.junior_baller.max_daily_spend} coins reached.`);
            }
        } else if (userAgeTier === 'academy_prospect') {
            if (item.category === 'physical' && SPENDING_RULES.academy_prospect.physical_requires_approval) {
                // Create Approval Request
                await db.collection('approvals').add({
                    childId: userId,
                    parentId: userData.parentUid,
                    type: 'spend_request',
                    item,
                    status: 'pending',
                    timestamp: firestore.FieldValue.serverTimestamp()
                });
                return { status: 'pending_approval', message: 'Request sent to parent' };
            }
        }

        // 3. Process Transaction
        await userRef.update({
            coins: firestore.FieldValue.increment(-item.cost)
        });

        await db.collection('transactions').add({
            userId,
            type: 'spend',
            itemId: item.id,
            itemName: item.name,
            amount: item.cost,
            timestamp: firestore.FieldValue.serverTimestamp(),
            dateString: new Date().toISOString().split('T')[0]
        });

        // Notify Parent if Junior Baller
        if (userAgeTier === 'junior_baller' && userData.parentUid) {
            await db.collection('users').doc(userData.parentUid).collection('notifications').add({
                type: 'child_spend',
                childId: userId,
                childName: userData.displayName || userData.username,
                itemName: item.name,
                amount: item.cost,
                timestamp: firestore.FieldValue.serverTimestamp()
            });
        }

        return { status: 'success', message: 'Item redeemed!' };
    },

    async getTransactionHistory(userId: string) {
        try {
            const querySnap = await db.collection('transactions')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();
            return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error: any) {
            console.warn('Index error in history query, falling back to in-memory sort:', error);
            // Fallback: Query without orderBy and sort manually
            const fallbackSnap = await db.collection('transactions')
                .where('userId', '==', userId)
                .limit(50)
                .get();

            const results = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            return results.sort((a, b) => {
                const tA = a.timestamp?.seconds || 0;
                const tB = b.timestamp?.seconds || 0;
                return tB - tA;
            });
        }
    },

    async updateTaskProgress(actionType: string, amount: number) {
        // Compatibility wrapper for trackActivity
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return;

        if (actionType === 'watch_5_videos') {
            // VideoFeed sends 'watch_5_videos' which is actually 'watch_video' in our new logic
            await this.trackActivity(currentUser.uid, 'watch_video', { postId: 'none_tracked' });
        } else {
            await this.awardCoins(currentUser.uid, actionType);
        }
    }
};

export default RewardService;
