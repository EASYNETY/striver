import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// Set global options
setGlobalOptions({ region: 'us-central1' });

// Initialize Admin once
if (admin.apps.length === 0) admin.initializeApp();

const getDb = () => admin.firestore();

/**
 * Send OTP via Email or WhatsApp
 */
export const sendOTP = onCall(async (request: any) => {
    const sgMail = require("@sendgrid/mail");
    const functions = require('firebase-functions');
    const sendUri = functions.config().sendgrid?.key || process.env.SENDGRID_API_KEY;

    if (sendUri) sgMail.setApiKey(sendUri);

    const { email, phoneNumber, channel, otp: providedOtp } = request.data;
    const otp = providedOtp || Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    if (request.auth) {
        await getDb().collection('otps').doc(request.auth.uid).set({
            otp, expiresAt, channel,
        });
    }

    try {
        if (channel === 'whatsapp' || channel === 'sms') {
            console.log(`Sending to ${phoneNumber}: ${otp}`);
            return { success: true, message: 'Mock sent' };
        } else {
            if (!sendUri) return { success: false, message: 'SendGrid not configured' };
            const msg = {
                to: email, from: 'noreply@striver.app',
                subject: 'Your Striver Verification Code',
                text: `Your verification code is: ${otp}`,
                html: `<h1 style="color:#8FFBB9;">striver</h1><p>Code: <b>${otp}</b></p>`,
            };
            await sgMail.send(msg);
            return { success: true };
        }
    } catch (error) {
        throw new HttpsError('internal', 'Internal error');
    }
});

/**
 * Verify OTP
 */
export const verifyOTP = onCall(async (request: any) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    const { code } = request.data;
    const otpDoc = await getDb().collection('otps').doc(request.auth.uid).get();

    if (!otpDoc.exists) throw new HttpsError('not-found', 'No code found');
    const { otp, expiresAt } = otpDoc.data() as any;

    if (Date.now() > expiresAt) throw new HttpsError('failed-precondition', 'Code expired');
    if (otp !== code) return { success: false, message: 'Invalid code' };

    await getDb().collection('users').doc(request.auth.uid).update({
        isEmailVerified: true,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await otpDoc.ref.delete();
    return { success: true };
});

/**
 * Update Password via OTP
 */
export const updatePasswordWithOTP = onCall(async (request: any) => {
    const { email, otp, newPassword } = request.data;
    if (!email || !otp || !newPassword) throw new HttpsError('invalid-argument', 'Missing params');

    try {
        const resetDoc = await getDb().collection('passwordResets').doc(email.toLowerCase()).get();
        if (!resetDoc.exists) throw new HttpsError('not-found', 'No reset request');

        const resetData = resetDoc.data() as any;
        if (resetData.otp !== otp) throw new HttpsError('permission-denied', 'Invalid code');

        const userRecord = await admin.auth().getUserByEmail(email.toLowerCase());
        await admin.auth().updateUser(userRecord.uid, { password: newPassword });
        await resetDoc.ref.delete();

        return { success: true };
    } catch (error: any) {
        throw new HttpsError('internal', 'Update failed');
    }
});

// Lazy Exports for high-performance deployment capture
export * from './videos/upload';
export * from './admin';
