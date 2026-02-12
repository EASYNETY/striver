import { db, firebaseAuth, modularDb } from '../api/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    limit,
    serverTimestamp,
    increment,
    Timestamp
} from '@react-native-firebase/firestore';
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
            // Check if this daily reward was already claimed today
            if (['daily_login', 'watch_5_videos', 'post_response', 'complete_challenge'].includes(actionType)) {
                const today = new Date().toISOString().split('T')[0];
                const q = query(
                    collection(modularDb, 'transactions'),
                    where('userId', '==', userId),
                    where('actionType', '==', actionType),
                    where('dateString', '==', today)
                );
                const claimSnap = await getDocs(q);

                if (!claimSnap.empty) {
                    console.log(`Reward ${actionType} already claimed today.`);
                    return;
                }
            }

            const userDocRef = doc(modularDb, 'users', userId);

            // Update User Balance & Total Career Earnings
            await updateDoc(userDocRef, {
                coins: increment(amount),
                career_earnings: increment(amount),
                last_earned_date: serverTimestamp()
            });

            // Log Transaction
            await addDoc(collection(modularDb, 'transactions'), {
                userId,
                type: 'earn',
                actionType,
                amount,
                timestamp: serverTimestamp(),
                dateString: new Date().toISOString().split('T')[0],
                metadata
            });

            // Check for Tier Upgrade
            await this.checkAndUpgradeTier(userId);
        }
    },

    async trackActivity(userId: string, actionType: string, metadata: any = {}) {
        const today = new Date().toISOString().split('T')[0];
        const progressDocRef = doc(modularDb, 'users', userId, 'daily_progress', today);

        if (actionType === 'watch_video') {
            const videoId = metadata.postId;
            if (!videoId) return;

            const docSnap = await getDoc(progressDocRef);
            const data = docSnap.exists ? docSnap.data() : { watched_videos: [] };
            const watchedList = (data?.watched_videos || []) as string[];

            if (!watchedList.includes(videoId)) {
                const newWatchedList = [...watchedList, videoId];
                await setDoc(progressDocRef, {
                    watched_videos: newWatchedList,
                    watch_count: newWatchedList.length,
                    last_updated: serverTimestamp()
                }, { merge: true });

                // If they reached 5 videos, award coins
                if (newWatchedList.length === 5) {
                    await this.awardCoins(userId, 'watch_5_videos');
                }
            }
        } else {
            await this.awardCoins(userId, actionType, metadata);
        }
    },

    async getDailyProgress(userId: string) {
        const today = new Date().toISOString().split('T')[0];
        const progressDocRef = doc(modularDb, 'users', userId, 'daily_progress', today);
        const progressSnap = await getDoc(progressDocRef);
        const data = progressSnap.exists ? progressSnap.data() : {};

        // Also check transaction history
        const q = query(
            collection(modularDb, 'transactions'),
            where('userId', '==', userId),
            where('dateString', '==', today),
            where('type', '==', 'earn')
        );
        const claimSnap = await getDocs(q);
        const claimedActions = claimSnap.docs.map(d => d.data().actionType);

        return {
            watch_count: data?.watch_count || 0,
            claimedActions
        };
    },

    async checkAndUpgradeTier(userId: string) {
        const userDocRef = doc(modularDb, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists) return;

        const userData = userSnap.data() as any;
        const currentEarnings = userData.career_earnings || 0;
        const currentTierId = userData.career_tier_id || 'future_star';

        let newTier = CAREER_TIERS[0];
        for (let i = CAREER_TIERS.length - 1; i >= 0; i--) {
            if (currentEarnings >= CAREER_TIERS[i].threshold) {
                newTier = CAREER_TIERS[i];
                break;
            }
        }

        if (newTier.id !== currentTierId) {
            const badge = BADGE_TIERS.find(b => b.tierRange.includes(newTier.id))?.id || 'bronze';

            await updateDoc(userDocRef, {
                career_tier_id: newTier.id,
                badge_status: badge
            });

            await addDoc(collection(modularDb, 'transactions'), {
                userId,
                type: 'earn',
                actionType: 'tier_up',
                amount: 0,
                metadata: {
                    tierId: newTier.id,
                    tierName: newTier.name
                },
                timestamp: serverTimestamp()
            });
        }
    },

    async deductCoins(userId: string, amount: number, reason: string) {
        const userDocRef = doc(modularDb, 'users', userId);

        await updateDoc(userDocRef, {
            coins: increment(-amount)
        });

        await addDoc(collection(modularDb, 'transactions'), {
            userId,
            type: 'spend',
            actionType: 'squad_join_fee',
            amount,
            timestamp: serverTimestamp(),
            dateString: new Date().toISOString().split('T')[0],
            metadata: { reason }
        });
    },

    async spendCoins(userId: string, item: any) {
        const userDocRef = doc(modularDb, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists) throw new Error('User not found');

        const userData = userSnap.data() as any;
        const userCoins = userData.coins || 0;
        const userAgeTier = checkAgeTier(userData.dob);

        if (userCoins < item.cost) throw new Error('Insufficient coins');

        if (userAgeTier === 'junior_baller') {
            if (!SPENDING_RULES.junior_baller.allowed_categories.includes(item.category)) {
                throw new Error('This item is not available for your account type.');
            }

            const today = new Date().toISOString().split('T')[0];
            const q = query(
                collection(modularDb, 'transactions'),
                where('userId', '==', userId),
                where('type', '==', 'spend'),
                where('dateString', '==', today)
            );
            const dailySpendSnap = await getDocs(q);

            let dayTotal = 0;
            dailySpendSnap.forEach(d => {
                dayTotal += (d.data().amount || 0);
            });

            if (dayTotal + item.cost > SPENDING_RULES.junior_baller.max_daily_spend) {
                throw new Error(`Daily spending limit of ${SPENDING_RULES.junior_baller.max_daily_spend} coins reached.`);
            }
        } else if (userAgeTier === 'academy_prospect') {
            if (item.category === 'physical' && SPENDING_RULES.academy_prospect.physical_requires_approval) {
                await addDoc(collection(modularDb, 'approvals'), {
                    childId: userId,
                    parentId: userData.parentUid,
                    type: 'spend_request',
                    item,
                    status: 'pending',
                    timestamp: serverTimestamp()
                });
                return { status: 'pending_approval', message: 'Request sent to parent' };
            }
        }

        await updateDoc(userDocRef, {
            coins: increment(-item.cost)
        });

        await addDoc(collection(modularDb, 'transactions'), {
            userId,
            type: 'spend',
            itemId: item.id,
            itemName: item.name,
            amount: item.cost,
            timestamp: serverTimestamp(),
            dateString: new Date().toISOString().split('T')[0]
        });

        if (userAgeTier === 'junior_baller' && userData.parentUid) {
            await addDoc(collection(doc(modularDb, 'users', userData.parentUid), 'notifications'), {
                type: 'child_spend',
                childId: userId,
                childName: userData.displayName || userData.username,
                itemName: item.name,
                amount: item.cost,
                timestamp: serverTimestamp()
            });
        }

        return { status: 'success', message: 'Item redeemed!' };
    },

    async getTransactionHistory(userId: string) {
        try {
            const q = query(
                collection(modularDb, 'transactions'),
                where('userId', '==', userId),
                limit(50)
            );
            const querySnap = await getDocs(q);
            const results = querySnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            return results.sort((a, b) => {
                const tA = a.timestamp?.seconds || 0;
                const tB = b.timestamp?.seconds || 0;
                return tB - tA;
            });
        } catch (error: any) {
            console.error('History query error:', error);
            return [];
        }
    },

    async updateTaskProgress(actionType: string, amount: number) {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return;

        if (actionType === 'watch_5_videos') {
            await this.trackActivity(currentUser.uid, 'watch_video', { postId: 'none_tracked' });
        } else {
            await this.awardCoins(currentUser.uid, actionType);
        }
    }
};

export default RewardService;
