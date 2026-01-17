import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// IMPORTANT: Set up your API keys here
// import * as twilio from 'twilio';
// import * as sgMail from '@sendgrid/mail';
// const twilioClient = twilio('ACCOUNT_SID', 'AUTH_TOKEN');
// sgMail.setApiKey('YOUR_SENDGRID_KEY');

/**
 * Triggered when a new user is created.
 * Determines age tier and sets safety defaults.
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
    const { uid, email } = user;

    // This would ideally be called with DOB from the client
    // For now, we'll wait for the profile update to set rules
    console.log(`New user created: ${uid} (${email})`);
});

/**
 * Triggered when a profile is updated.
 * Enforces safety rules for 4-12 accounts.
 */
export const onProfileUpdate = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();

        // If ageTier changed to 4_12, ensure privacy
        if (newData.ageTier === '4_12' && oldData.ageTier !== '4_12') {
            await change.after.ref.update({
                isPrivate: true,
                commentsEnabled: false,
                dmsEnabled: false,
            });
        }
    });

/**
 * Stripe Payment Webhook
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    // Verify signature and process payment
    // ...
    res.status(200).send('Webhook processed');
});

/**
 * Parental Approval Workflow
 */
export const requestParentalApproval = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

    const { childId, actionType, actionData } = data;

    // 1. Get child data
    const childDoc = await db.collection('users').doc(childId).get();
    const parentEmail = childDoc.data()?.email; // For <13, child email is parent email

    // 2. Create approval request
    await db.collection('moderationQueue').add({
        childId,
        parentEmail,
        actionType,
        actionData,
        status: 'pending',
        createdAt: admin.firestore.FieldUint.now(),
    });

    // 3. Send email to parent (via SendGrid or similar)
    // ...

    return { success: true };
});

/**
 * Send OTP via Email or WhatsApp
 */
export const sendOTP = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

    const { email, phoneNumber, channel } = data;
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // 1. Store OTP in Firestore
    await db.collection('otps').doc(context.auth.uid).set({
        otp,
        expiresAt,
        channel,
    });

    try {
        if (channel === 'whatsapp') {
            // WHATSAPP INTEGRATION (Twilio Example)
            // client.messages.create({
            //     from: 'whatsapp:+14155238886',
            //     body: `Your Striver verification code is: ${otp}`,
            //     to: `whatsapp:${phoneNumber}`
            // });
            console.log(`[WhatsApp OTP] Sending ${otp} to ${phoneNumber}`);
        } else {
            // EMAIL INTEGRATION (SendGrid Example)
            // sgMail.send({
            //     to: email,
            //     from: 'welcome@striver.com',
            //     subject: 'Your Striver Verification Code',
            //     text: `Your verification code is ${otp}`,
            // });
            console.log(`[Email OTP] Sending ${otp} to ${email}`);
        }
        return { success: true };
    } catch (error) {
        console.error('OTP Send Error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send OTP');
    }
});

/**
 * Verify OTP
 */
export const verifyOTP = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

    const { code } = data;
    const otpDoc = await db.collection('otps').doc(context.auth.uid).get();

    if (!otpDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'No code found for this user');
    }

    const { otp, expiresAt } = otpDoc.data() as any;

    // 1. Check expiration
    if (Date.now() > expiresAt) {
        throw new functions.https.HttpsError('failed-precondition', 'Code has expired');
    }

    // 2. Check code
    if (otp !== code) {
        return { success: false, message: 'Invalid verification code' };
    }

    // 3. Mark user as verified and delete code
    await db.collection('users').doc(context.auth.uid).update({
        isEmailVerified: true,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await otpDoc.ref.delete();

    return { success: true };
});

