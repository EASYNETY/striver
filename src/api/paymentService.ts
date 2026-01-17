import { initStripe, presentPaymentSheet, useStripe } from '@stripe/stripe-react-native';
import functions from '@react-native-firebase/functions';
import firestore from '@react-native-firebase/firestore';
import { db, firebaseAuth } from './firebase';

export interface PaymentIntentResponse {
    paymentIntent: string;
    ephemeralKey: string;
    customer: string;
    subscriptionId?: string;
}

class PaymentService {
    private transactionsCollection = db.collection('transactions');

    // initialize payment sheet for a purchase
    async initializePaymentSheet(amount: number, currency: string = 'gbp', description: string) {
        try {
            // Call backend to create payment intent
            const createPaymentIntent = functions().httpsCallable('createPaymentIntent');
            const { data } = await createPaymentIntent({
                amount,
                currency,
                description,
            });

            const { paymentIntent, ephemeralKey, customer } = data as PaymentIntentResponse;

            // Initialize Stripe Payment Sheet
            const { error } = await initStripe({
                merchantIdentifier: 'merchant.com.striver',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                // Set `allowsDelayedPaymentMethods` to true if your business can handle payment methods that complete payment after a delay, like SEPA Debit and Sofort.
                allowsDelayedPaymentMethods: true,
                defaultBillingDetails: {
                    name: firebaseAuth.currentUser?.displayName || 'Striver User',
                }
            });

            if (error) {
                console.error('Stripe Init Error:', error);
                throw new Error(error.message);
            }

            return true;
        } catch (error: any) {
            console.error('Payment Service Error:', error);
            throw new Error(error.message || 'Failed to initialize payment');
        }
    }

    // New subscription flow
    async initializeSubscription(priceId: string) {
        try {
            const createSubscription = functions().httpsCallable('createSubscription');
            const { data } = await createSubscription({
                priceId,
            });

            const { paymentIntent, ephemeralKey, customer, subscriptionId } = data as PaymentIntentResponse;

            const { error } = await initStripe({
                merchantIdentifier: 'merchant.com.striver',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                allowsDelayedPaymentMethods: false, // Subscription typically needs immediate confirm
            });

            if (error) throw new Error(error.message);
            return subscriptionId;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to initialize subscription');
        }
    }

    // Open the payment sheet
    async openPaymentSheet() {
        const { error } = await presentPaymentSheet();

        if (error) {
            throw new Error(error.message);
        }

        return true;
    }

    // Verify transaction status manually if needed (Backend usually handles webhooks)
    async verifyTransaction(paymentId: string) {
        // Implementation depends on backend status
    }
}

export default new PaymentService();
