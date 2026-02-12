import { db, firebaseAuth } from './firebase';
import firestore from '@react-native-firebase/firestore';

export interface MentorWaitlistRequest {
    id?: string;
    userId: string;
    username: string;
    email: string;
    requestedAt: any;
    status: 'pending' | 'approved' | 'rejected' | 'revoked';
    reason?: string;
    adminNotes?: string;
}

class MentorWaitlistService {
    private waitlistCollection = 'mentor_waitlist';

    /**
     * Submit a request to join the mentor waitlist
     */
    async submitRequest(reason?: string): Promise<{ success: boolean; message: string }> {
        console.log('[MentorWaitlist] submitRequest called');
        try {
            const currentUser = firebaseAuth.currentUser;
            if (!currentUser) {
                return { success: false, message: 'User not authenticated' };
            }

            // Check for existing request
            const existingRequest = await this.getUserRequest(currentUser.uid);
            if (existingRequest) {
                if (existingRequest.status === 'pending') {
                    return { success: false, message: 'You already have a pending request.' };
                } else if (existingRequest.status === 'approved') {
                    return { success: false, message: 'You are already approved as a mentor.' };
                }
                // If rejected or revoked, allow new request
            }

            // Get user profile for username
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            const userData = userDoc.data();

            // Create new request
            await db.collection(this.waitlistCollection).add({
                userId: currentUser.uid,
                username: userData?.username || 'Unknown',
                email: currentUser.email || '',
                requestedAt: firestore.FieldValue.serverTimestamp(),
                status: 'pending',
                reason: reason || 'User requested mentor access'
            });

            return { success: true, message: 'Your mentor application has been submitted successfully!' };
        } catch (error: any) {
            console.error('[MentorWaitlist] Error submitting request:', error);
            return {
                success: false,
                message: error.message || 'Failed to submit request. Please try again.'
            };
        }
    }

    /**
     * Get the current user's waitlist request status
     */
    async getUserRequest(userId: string): Promise<MentorWaitlistRequest | null> {
        try {
            const snapshot = await db.collection(this.waitlistCollection)
                .where('userId', '==', userId)
                .orderBy('requestedAt', 'desc')
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as MentorWaitlistRequest;
        } catch (error) {
            console.error('[MentorWaitlist] Error fetching request:', error);
            return null;
        }
    }

    /**
     * Cancel or revoke a user's request
     */
    async cancelUserRequest(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const request = await this.getUserRequest(userId);
            if (!request || !request.id) {
                return { success: false, message: 'No active request found.' };
            }

            await db.collection(this.waitlistCollection).doc(request.id).update({
                status: 'revoked',
                updatedAt: firestore.FieldValue.serverTimestamp()
            });

            return { success: true, message: 'Request revoked successfully.' };
        } catch (error: any) {
            console.error('[MentorWaitlist] Error cancelling request:', error);
            return { success: false, message: error.message || 'Failed to cancel request.' };
        }
    }

    /**
     * Check if user is a mentor
     */
    async isMentor(userId: string): Promise<boolean> {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            return userDoc.data()?.isMentor === true;
        } catch (error) {
            console.error('Error checking mentor status:', error);
            return false;
        }
    }
}

export default new MentorWaitlistService();
