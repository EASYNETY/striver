import { HttpsError } from "firebase-functions/v2/https";

// Helper function to calculate age
export function calculateAge(dateOfBirth: string): number {
    const parts = dateOfBirth.split('/');
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

// Helper function to create Ondato session
export async function createOndatoSession(externalReferenceId: string) {
    const ONDATO_USERNAME = process.env.ONDATO_USERNAME;
    const ONDATO_PASSWORD = process.env.ONDATO_PASSWORD;
    const ONDATO_SETUP_ID = process.env.ONDATO_SETUP_ID;
    const ONDATO_API_URL = process.env.ONDATO_API_URL || 'https://api.ondato.com';

    try {
        const authHeader = `Basic ${Buffer.from(`${ONDATO_USERNAME}:${ONDATO_PASSWORD}`).toString('base64')}`;
        const axios = require('axios');

        const response = await axios.post(
            `${ONDATO_API_URL}/v1/kyc/identifications`,
            {
                externalReferenceId,
                setupId: ONDATO_SETUP_ID,
                successUrl: 'striver://verification-success',
                errorUrl: 'striver://verification-failed',
                language: 'en',
            },
            {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                },
            }
        );

        const verificationUrl = `https://idv.ondato.com/setups/${ONDATO_SETUP_ID}?externalRef=${externalReferenceId}&successUrl=striver://verification-success&failureUrl=striver://verification-failed`;

        return {
            success: true,
            identificationId: response.data.id,
            verificationUrl,
        };
    } catch (error: any) {
        console.error('Ondato session creation error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create Ondato session',
        };
    }
}

export async function handleOndatoVerification(auth: any, data: any, db: any) {
    let userId = auth?.uid;

    if (!userId) {
        const headerSample = JSON.stringify(data?.rawRequest?.headers || {});
        console.warn(`[handleOndatoVerification] AUTH CONTEXT MISSING. Headers: ${headerSample.substring(0, 100)}`);

        // DEBUG FALLBACK: If auth is missing, try to get UID from data (for testing only)
        if (data.userId) {
            console.warn(`[handleOndatoVerification] Using UID from data fallback: ${data.userId}`);
            userId = data.userId;
        } else {
            throw new HttpsError('unauthenticated', 'User must be logged in or provide valid UID for debug.');
        }
    }

    const { dateOfBirth } = data;
    console.log(`[handleOndatoVerification] Processing for userId: ${userId}, DOB: ${dateOfBirth}`);

    if (!dateOfBirth) {
        throw new HttpsError('invalid-argument', 'Date of birth is required');
    }

    // Validate age (must be 18+)
    const age = calculateAge(dateOfBirth);
    if (age < 18) {
        throw new HttpsError('failed-precondition', 'You must be 18 or older to create a parent account');
    }

    const admin = require('firebase-admin');

    try {
        // Check for existing active verification attempts (within last 30 minutes)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const existingAttempts = await db.collection('verification_attempts')
            .where('userId', '==', userId)
            .where('status', '==', 'pending')
            .where('createdAt', '>', thirtyMinutesAgo)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (!existingAttempts.empty) {
            const existingAttempt = existingAttempts.docs[0].data();
            return {
                sessionId: existingAttempt.sessionId,
                verificationUrl: existingAttempt.verificationUrl,
                message: 'Using existing verification session',
            };
        }

        // Expire old pending sessions
        const oldAttempts = await db.collection('verification_attempts')
            .where('userId', '==', userId)
            .where('status', '==', 'pending')
            .where('createdAt', '<=', thirtyMinutesAgo)
            .get();

        const batch = db.batch();
        oldAttempts.docs.forEach((doc: any) => {
            batch.update(doc.ref, { status: 'expired' });
        });
        await batch.commit();

        // Use provided sessionId or generate unique one
        const sessionId = data.sessionId || `ondato_${userId}_${Date.now()}`;

        // Create Ondato verification session
        const ondatoResult = await createOndatoSession(sessionId);

        if (!ondatoResult.success) {
            throw new HttpsError('internal', ondatoResult.error || 'Failed to create Ondato session');
        }

        // Store verification attempt in Firestore
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        await db.collection('verification_attempts').add({
            userId,
            sessionId,
            externalReferenceId: sessionId, // Unified with sessionId
            method: 'ondato',
            status: 'pending',
            verificationUrl: ondatoResult.verificationUrl,
            metadata: {
                dateOfBirth,
                ondatoIdentificationId: ondatoResult.identificationId,
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt,
        });

        // Update user profile status
        await db.collection('users').doc(userId).update({
            'profileStatus.ageVerification': 'pending',
            'profileStatus.verificationStartedAt': admin.firestore.FieldValue.serverTimestamp(),
            'profile_status.age_verification': 'pending', // Snake case
            'profile_status.verification_started_at': admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
            sessionId,
            verificationUrl: ondatoResult.verificationUrl,
            expiresAt: expiresAt.toISOString(),
        };

    } catch (error: any) {
        console.error('Verification error:', error);
        throw new HttpsError('internal', error.message || 'Failed to start verification');
    }
}
export async function syncOndatoStatus(auth: any, data: any, db: any) {
    let userId = auth?.uid || data.userId;
    if (!userId) {
        throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { sessionId } = data;
    if (!sessionId) {
        throw new HttpsError('invalid-argument', 'Session ID is required');
    }

    const admin = require('firebase-admin');
    const axios = require('axios');

    try {
        // 1. Get the attempt from Firestore
        const snapshot = await db.collection('verification_attempts')
            .where('sessionId', '==', sessionId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            throw new HttpsError('not-found', 'Verification attempt not found');
        }

        const doc = snapshot.docs[0];
        const attempt = doc.data();
        const identificationId = attempt.metadata?.ondatoIdentificationId;

        if (!identificationId) {
            // If we don't have an ID, we can't sync with API
            return { status: attempt.status, message: 'No Ondato ID to sync' };
        }

        // 2. Query Ondato API
        const ONDATO_USERNAME = process.env.ONDATO_USERNAME;
        const ONDATO_PASSWORD = process.env.ONDATO_PASSWORD;
        const ONDATO_API_URL = process.env.ONDATO_API_URL || 'https://api.ondato.com';

        // Check if we have real credentials
        if (!ONDATO_USERNAME || ONDATO_USERNAME === 'your_ondato_username') {
            return { status: attempt.status, message: 'Mock mode: Update Firestore manually' };
        }

        const authHeader = `Basic ${Buffer.from(`${ONDATO_USERNAME}:${ONDATO_PASSWORD}`).toString('base64')}`;

        const response = await axios.get(
            `${ONDATO_API_URL}/v1/kyc/identifications/${identificationId}`,
            {
                headers: { 'Authorization': authHeader }
            }
        );

        const ondatoStatus = response.data.status;
        console.log(`Ondato API Status for ${identificationId}: ${ondatoStatus}`);

        // Status mapping (Ondato -> Striver)
        let newStatus = attempt.status;
        if (ondatoStatus === 'Approved') newStatus = 'completed';
        else if (ondatoStatus === 'Rejected') newStatus = 'failed';
        else if (ondatoStatus === 'Pending') newStatus = 'pending';

        // 3. Update Firestore if changed
        if (newStatus !== attempt.status) {
            await doc.ref.update({
                status: newStatus,
                lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
                ondatoRawStatus: ondatoStatus
            });

            // If verified, update user profile
            if (newStatus === 'completed') {
                await db.collection('users').doc(attempt.userId).update({
                    ageVerificationStatus: 'verified',
                    'profileStatus.ageVerification': 'verified',
                    'profile_status.age_verification': 'verified'
                });
            }
        }

        return { status: newStatus, ondatoStatus };

    } catch (error: any) {
        console.error('Sync error:', error.response?.data || error.message);
        throw new HttpsError('internal', 'Status sync failed');
    }
}
