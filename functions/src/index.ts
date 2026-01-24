// Minimal reference for the CLI to detect the package
const { onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

// Set global options for v2 functions
setGlobalOptions({ region: 'us-central1' });

/**
 * Send OTP via Email or WhatsApp
 */
export const sendOTP = onCall(async (request: any) => {
    const admin = require('firebase-admin');
    const sgMail = require('@sendgrid/mail');

    // Initialize Firebase Admin if not already done
    if (admin.apps.length === 0) admin.initializeApp();
    const db = admin.firestore();

    // Configure SendGrid
    // Note: Make sure to set the API key using: firebase functions:config:set sendgrid.key="YOUR_API_KEY"
    // Or set SENDGRID_API_KEY environment variable
    const sendUri = require('firebase-functions').config().sendgrid?.key || process.env.SENDGRID_API_KEY;

    if (!sendUri) {
        console.error("SendGrid API Key is missing. Please configure it.");
        // We don't throw immediately to allow other channels (SMS/WhatsApp) to potentially work or mock dev mode
    } else {
        sgMail.setApiKey(sendUri);
    }

    const { email, phoneNumber, channel, otp: providedOtp } = request.data;
    const otp = providedOtp || Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Store OTP in Firestore
    if (request.auth) {
        await db.collection('otps').doc(request.auth.uid).set({
            otp,
            expiresAt,
            channel,
        });
    }

    try {
        if (channel === 'whatsapp' || channel === 'sms') {
            console.log(`[${channel.toUpperCase()}] Sending ${otp} to ${phoneNumber}`);
            return { success: true, message: 'Mock sent successfully' };
        } else {
            console.log(`[Email OTP] Sending ${otp} to ${email}`);

            if (!sendUri) {
                // If in dev/test without key, maybe we just log it
                console.warn("SendGrid Key not found. Email not actually sent (Logged only).");
                return { success: false, message: 'SendGrid not configured' };
            }

            const msg = {
                to: email,
                from: 'noreply@striver.app', // Ensure this sender is verified in SendGrid
                subject: 'Your Striver Verification Code',
                text: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                                background-color: #0A1128;
                                color: #ffffff;
                                padding: 20px;
                            }
                            .container {
                                max-width: 600px;
                                margin: 0 auto;
                                background: linear-gradient(135deg, #1a2744 0%, #0A1128 100%);
                                border-radius: 16px;
                                padding: 40px;
                                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                            }
                            .logo {
                                text-align: center;
                                margin-bottom: 30px;
                            }
                            .logo h1 {
                                color: #8FFBB9;
                                font-size: 32px;
                                font-weight: 900;
                                margin: 0;
                                text-transform: lowercase;
                            }
                            .otp-box {
                                background: rgba(143, 251, 185, 0.1);
                                border: 2px solid #8FFBB9;
                                border-radius: 12px;
                                padding: 30px;
                                text-align: center;
                                margin: 30px 0;
                            }
                            .otp-code {
                                font-size: 48px;
                                font-weight: 800;
                                color: #8FFBB9;
                                letter-spacing: 8px;
                                margin: 0;
                            }
                            .message {
                                color: #B8C5D6;
                                line-height: 1.6;
                                margin: 20px 0;
                            }
                            .footer {
                                text-align: center;
                                color: #6B7A8F;
                                font-size: 12px;
                                margin-top: 40px;
                                padding-top: 20px;
                                border-top: 1px solid rgba(255,255,255,0.1);
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="logo">
                                <h1>striver</h1>
                                <p style="color: #8FFBB9; font-size: 12px; font-weight: 700; letter-spacing: 2px; margin: 0;">THE FUTURE OF FOOTBALL</p>
                            </div>
                            
                            <p class="message">
                                Hi there! 👋
                            </p>
                            
                            <p class="message">
                                Here's your verification code to complete your Striver registration:
                            </p>
                            
                            <div class="otp-box">
                                <p class="otp-code">${otp}</p>
                            </div>
                            
                            <p class="message">
                                This code will expire in <strong>10 minutes</strong>.
                            </p>
                            
                            <p class="message">
                                If you didn't request this code, you can safely ignore this email.
                            </p>
                            
                            <div class="footer">
                                <p>© 2026 Striver. All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            };

            await sgMail.send(msg);
            return { success: true, message: 'Email sent successfully' };
        }
    } catch (error) {
        console.error('OTP Send Error:', error);
        const { HttpsError } = require("firebase-functions/v2/https");
        throw new HttpsError('internal', 'Internal error');
    }
});

/**
 * Verify OTP
 */
export const verifyOTP = onCall(async (request: any) => {
    const admin = require('firebase-admin');
    if (admin.apps.length === 0) admin.initializeApp();
    const db = admin.firestore();

    const { HttpsError } = require("firebase-functions/v2/https");
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    const { code } = request.data;
    const otpDoc = await db.collection('otps').doc(request.auth.uid).get();

    if (!otpDoc.exists) throw new HttpsError('not-found', 'No code found');
    const { otp, expiresAt } = otpDoc.data() as any;

    if (Date.now() > expiresAt) throw new HttpsError('failed-precondition', 'Code expired');
    if (otp !== code) return { success: false, message: 'Invalid code' };

    await db.collection('users').doc(request.auth.uid).update({
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
    const admin = require('firebase-admin');
    if (admin.apps.length === 0) admin.initializeApp();
    const db = admin.firestore();

    const { HttpsError } = require("firebase-functions/v2/https");
    const { email, otp, newPassword } = request.data;
    if (!email || !otp || !newPassword) throw new HttpsError('invalid-argument', 'Missing params');

    try {
        const resetDoc = await db.collection('passwordResets').doc(email.toLowerCase()).get();
        if (!resetDoc.exists) throw new HttpsError('not-found', 'No reset request');

        const resetData = resetDoc.data() as any;
        if (resetData.otp !== otp) throw new HttpsError('permission-denied', 'Invalid code');
        const expiresAtMillis = resetData.expiresAt.toDate ? resetData.expiresAt.toDate().getTime() : (resetData.timestamp?.seconds ? resetData.timestamp.seconds * 1000 : resetData.expiresAt);
        if (Date.now() > expiresAtMillis) throw new HttpsError('failed-precondition', 'Code expired');

        const userRecord = await admin.auth().getUserByEmail(email.toLowerCase());
        await admin.auth().updateUser(userRecord.uid, { password: newPassword });
        await resetDoc.ref.delete();

        return { success: true };
    } catch (error: any) {
        throw new HttpsError('internal', 'Update failed');
    }
});

/**
 * Standard Auth Trigger (v1 style)
 */
// export const onUserCreated = require("firebase-functions/v1").auth.user().onCreate((user: any) => {
//     console.log(`New user: ${user.uid}`);
// });


// Video Handling Functions (Cloudflare Stream Migration)
export * from './videos/upload';
export * from './admin';
