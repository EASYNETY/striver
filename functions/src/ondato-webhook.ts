import { onRequest } from "firebase-functions/v2/https";

const ONDATO_USERNAME = process.env.ONDATO_USERNAME;
const ONDATO_PASSWORD = process.env.ONDATO_PASSWORD;

// Log for debugging (remove in production)
// Commented out to avoid deployment timeouts
// console.log('Webhook credentials loaded:', {
//     hasUsername: !!ONDATO_USERNAME,
//     hasPassword: !!ONDATO_PASSWORD,
//     username: ONDATO_USERNAME ? ONDATO_USERNAME.substring(0, 3) + '***' : 'MISSING'
// });

const getDb = () => {
    const admin = require('firebase-admin');
    if (admin.apps.length === 0) admin.initializeApp();
    return admin.firestore();
};

interface OndatoWebhookPayload {
    EventType: string;
    Payload: {
        Id: string;
        ExternalReferenceId: string;
        Status: string;
        VerificationData?: {
            DateOfBirth?: string;
            Age?: number;
            DocumentType?: string;
            DocumentNumber?: string;
            FirstName?: string;
            LastName?: string;
        };
        RejectionReasons?: string[];
    };
}

export const ondatoWebhook = onRequest({ cors: true }, async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        // Verify Basic Auth
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.error('No authorization header provided');
            res.status(401).json({ error: 'Unauthorized - No auth header' });
            return;
        }

        if (!verifyBasicAuth(authHeader)) {
            console.error('Basic auth verification failed');
            res.status(401).json({ error: 'Unauthorized - Invalid credentials' });
            return;
        }

        // Parse webhook payload
        const payload: OndatoWebhookPayload = req.body;
        console.log('Ondato webhook received:', JSON.stringify(payload, null, 2));

        const { EventType, Payload: webhookData } = payload;
        const { ExternalReferenceId: sessionId, Status, VerificationData, RejectionReasons } = webhookData;

        if (!sessionId) {
            res.status(400).json({ error: 'Missing session ID' });
            return;
        }

        const db = getDb();
        const admin = require('firebase-admin');

        // Find verification attempt
        const attemptSnapshot = await db.collection('verification_attempts')
            .where('sessionId', '==', sessionId)
            .limit(1)
            .get();

        if (attemptSnapshot.empty) {
            console.error('Verification attempt not found:', sessionId);
            res.status(404).json({ error: 'Verification attempt not found' });
            return;
        }

        const attemptDoc = attemptSnapshot.docs[0];
        const attempt = attemptDoc.data();

        // Determine verification status
        let verificationStatus: 'completed' | 'failed' = 'failed';
        let ageVerificationStatus: 'verified' | 'rejected' = 'rejected';

        if (EventType === 'KycIdentification.Approved' || Status === 'Approved') {
            verificationStatus = 'completed';
            ageVerificationStatus = 'verified';
        } else if (EventType === 'KycIdentification.Rejected' || Status === 'Rejected') {
            verificationStatus = 'failed';
            ageVerificationStatus = 'rejected';
        }

        // Update verification attempt
        await attemptDoc.ref.update({
            status: verificationStatus,
            metadata: {
                ...attempt.metadata,
                ondatoStatus: Status,
                verificationData: VerificationData,
                rejectionReasons: RejectionReasons,
                webhookReceivedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update user profile
        const updateData: any = {
            ageVerificationStatus: ageVerificationStatus,
            age_verification_status: ageVerificationStatus, // Snake case for consistency with user expectation
            ageVerificationDate: verificationStatus === 'completed'
                ? admin.firestore.FieldValue.serverTimestamp()
                : null,
            'profileStatus.ageVerification': ageVerificationStatus,
            'profileStatus.verificationCompletedAt': admin.firestore.FieldValue.serverTimestamp(),
            'profileStatus.verificationMethod': 'ondato',
            'profile_status.age_verification': ageVerificationStatus, // Snake case for consistency
        };

        await db.collection('users').doc(attempt.userId).update(updateData);

        // Calculate profile completion percentage
        if (verificationStatus === 'completed') {
            await updateProfileCompletion(db, attempt.userId);
        }

        // Create notification for user
        await createNotification(db, attempt.userId, verificationStatus, RejectionReasons);

        // Convert anonymous user to regular if profile is complete
        if (verificationStatus === 'completed') {
            await checkAndConvertAnonymousUser(db, attempt.userId);
        }

        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully',
            status: verificationStatus,
        });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.toString(),
        });
    }
});

// Verify Basic Auth credentials
function verifyBasicAuth(authHeader: string): boolean {
    try {
        const base64Credentials = authHeader.split(' ')[1];
        if (!base64Credentials) {
            console.error('No base64 credentials in auth header');
            return false;
        }

        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');

        console.log('Auth attempt:', {
            providedUsername: username,
            expectedUsername: ONDATO_USERNAME,
            usernameMatch: username === ONDATO_USERNAME,
            passwordMatch: password === ONDATO_PASSWORD,
            hasExpectedCreds: !!ONDATO_USERNAME && !!ONDATO_PASSWORD
        });

        return username === ONDATO_USERNAME && password === ONDATO_PASSWORD;
    } catch (error) {
        console.error('Auth verification error:', error);
        return false;
    }
}

// Update profile completion percentage
async function updateProfileCompletion(db: any, userId: string) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return;

        const user = userDoc.data();
        let completionPercentage = 0;
        const fields = [
            'username',
            'email',
            'displayName',
            'avatar',
            'bio',
            'dob',
            'ageVerificationStatus',
        ];

        fields.forEach(field => {
            if (user[field]) completionPercentage += (100 / fields.length);
        });

        const admin = require('firebase-admin');
        await db.collection('users').doc(userId).update({
            profileCompletion: Math.round(completionPercentage),
            onboardingComplete: completionPercentage >= 100,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error('Profile completion update error:', error);
    }
}

// Create notification for user
async function createNotification(
    db: any,
    userId: string,
    status: 'completed' | 'failed',
    rejectionReasons?: string[]
) {
    try {
        const admin = require('firebase-admin');
        const message = status === 'completed'
            ? 'Your age verification has been approved! You can now access all parent features.'
            : `Age verification failed. ${rejectionReasons ? rejectionReasons.join(', ') : 'Please try again or contact support.'}`;

        await db.collection('notifications').add({
            userId,
            type: 'verification_update',
            title: status === 'completed' ? 'Verification Approved' : 'Verification Failed',
            message,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error('Notification creation error:', error);
    }
}

// Check and convert anonymous user to regular user
async function checkAndConvertAnonymousUser(db: any, userId: string) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return;

        const user = userDoc.data();
        const admin = require('firebase-admin');

        if (user.profileCompletion >= 100 && user.accountType === 'anonymous') {
            await db.collection('users').doc(userId).update({
                accountType: 'family',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('Anonymous user conversion error:', error);
    }
}
