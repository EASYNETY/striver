import { db, firebaseAuth } from './firebase';
import firestore from '@react-native-firebase/firestore';

export interface SquadWaitlistRequest {
    id?: string;
    userId: string;
    username: string;
    email: string;
    requestedAt: any;
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
    adminNotes?: string;
    processedAt?: any;
    processedBy?: string;
}

class SquadWaitlistService {
    private waitlistCollection = 'squad_creation_waitlist';

    /**
     * Submit a squad creation request
     * Prevents duplicate requests from the same user
     */
    async submitRequest(reason?: string): Promise<{ success: boolean; message: string }> {
        console.log('[SquadWaitlist] submitRequest called with reason:', reason);
        try {
            // DIAGNOSTIC LOGGING
            console.log('[SquadWaitlist] Firebase App Name:', firebaseAuth.app.name);
            console.log('[SquadWaitlist] Firebase Project ID:', firebaseAuth.app.options.projectId);
            console.log('[SquadWaitlist] Target Collection:', this.waitlistCollection);

            const currentUser = firebaseAuth.currentUser;
            if (!currentUser) {
                console.error('[SquadWaitlist] No current user');
                throw new Error('User not authenticated');
            }
            console.log('[SquadWaitlist] Current user:', currentUser.uid);

            // Check if user already has a pending or approved request
            console.log('[SquadWaitlist] Checking for existing request...');
            const existingRequest = await this.getUserRequest(currentUser.uid);
            console.log('[SquadWaitlist] Existing request result:', existingRequest);

            if (existingRequest) {
                if (existingRequest.status === 'pending') {
                    return {
                        success: false,
                        message: 'You already have a pending squad creation request.'
                    };
                } else if (existingRequest.status === 'approved') {
                    return {
                        success: false,
                        message: 'Your squad creation request has already been approved.'
                    };
                }
            }

            // Get user profile for username
            console.log('[SquadWaitlist] Fetching user profile...');
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            const userData = userDoc.data();
            console.log('[SquadWaitlist] User profile data:', userData);

            // Create new request
            const requestData = {
                userId: currentUser.uid,
                username: userData?.username || 'Unknown',
                email: currentUser.email || '',
                requestedAt: firestore.FieldValue.serverTimestamp(),
                status: 'pending',
                reason: reason || 'User requested squad creation access',
                adminNotes: '',
            };

            console.log('[SquadWaitlist] Creating request document:', requestData);
            await db.collection(this.waitlistCollection).add(requestData);
            console.log('[SquadWaitlist] Request document created successfully');

            return {
                success: true,
                message: 'Your squad creation request has been submitted successfully!'
            };
        } catch (error: any) {
            console.error('[SquadWaitlist] Error submitting waitlist request:', error);
            // Include distinct error codes if possible
            const errorMsg = error.code ? `[${error.code}] ${error.message}` : error.message;
            return {
                success: false,
                message: errorMsg || 'Failed to submit request. Please try again.'
            };
        }
    }

    /**
     * Get user's existing request if any
     */
    async getUserRequest(userId: string): Promise<SquadWaitlistRequest | null> {
        try {
            console.log('[SquadWaitlist] getUserRequest for:', userId);
            const snapshot = await db
                .collection(this.waitlistCollection)
                .where('userId', '==', userId)
                .get();

            console.log('[SquadWaitlist] getUserRequest snapshot empty?', snapshot.empty, 'size:', snapshot.size);

            if (snapshot.empty) {
                return null;
            }

            // Return the most recent request
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as SquadWaitlistRequest));

            // Sort by requestedAt descending
            docs.sort((a, b) => {
                const aTime = a.requestedAt?.toMillis?.() || 0;
                const bTime = b.requestedAt?.toMillis?.() || 0;
                return bTime - aTime;
            });

            return docs[0];
        } catch (error) {
            console.error('[SquadWaitlist] Error getting user request:', error);
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
            console.error('[SquadWaitlist] Error cancelling request:', error);
            return { success: false, message: error.message || 'Failed to cancel request.' };
        }
    }

    /**
     * Check if user can create squads (approved or has permission)
     */
    async canCreateSquad(userId: string): Promise<boolean> {
        try {
            const request = await this.getUserRequest(userId);
            return request?.status === 'approved';
        } catch (error) {
            console.error('Error checking squad creation permission:', error);
            return false;
        }
    }
}

export default new SquadWaitlistService();
