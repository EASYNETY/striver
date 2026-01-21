import { db, firebaseAuth } from '../api/firebase';
import firestore from '@react-native-firebase/firestore';
import rewardService from './rewardService';
import userService from './userService';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: 'Merch' | 'Equipment' | 'Digital' | 'Experiences';
    stock: number;
    isFeatured?: boolean;
}

export interface Purchase {
    id: string;
    userId: string;
    productId: string;
    productName: string;
    price: number;
    timestamp: any;
    status: 'pending' | 'completed' | 'cancelled';
}

const PRODUCTS: Product[] = [
    {
        id: 'merch_1',
        name: 'Striver Pro Hoodie',
        description: 'Exclusive black hoodie with neon green Striver logo. High-quality cotton.',
        price: 250,
        image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=500&auto=format&fit=crop',
        category: 'Merch',
        stock: 50,
        isFeatured: true
    },
    {
        id: 'equipment_1',
        name: 'Training Cone Set (10pc)',
        description: 'Level up your dribbling drills with these professional agility cones.',
        price: 150,
        image: 'https://images.unsplash.com/photo-1511871893393-82e9c16b81e3?q=80&w=500&auto=format&fit=crop',
        category: 'Equipment',
        stock: 100
    },
    {
        id: 'digital_1',
        name: 'Legend Aura Profile Effect',
        description: 'Make your profile glow with a unique legend aura effect.',
        price: 300,
        image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=500&auto=format&fit=crop',
        category: 'Digital',
        stock: 999
    },
    {
        id: 'experience_1',
        name: 'Zoom Call with PL Academy Coach',
        description: 'Get a 30-minute private 1-on-1 session with a professional coach.',
        price: 1000,
        image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=500&auto=format&fit=crop',
        category: 'Experiences',
        stock: 5
    },
    {
        id: 'merch_2',
        name: 'Striver Training Jersey',
        description: 'Breathable sports fabric, perfect for high-intensity sessions.',
        price: 200,
        image: 'https://images.unsplash.com/photo-1577471412011-0428784f18d5?q=80&w=500&auto=format&fit=crop',
        category: 'Merch',
        stock: 30
    },
    {
        id: 'merch_3',
        name: 'Limited Edition Green Water Bottle',
        description: 'Stay hydrated in style with our signature neon green bottle.',
        price: 100,
        image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=500&auto=format&fit=crop',
        category: 'Merch',
        stock: 80
    }
];

class MarketplaceService {
    private purchasesCollection = db.collection('purchases');

    async getProducts(): Promise<Product[]> {
        // In a real app, this would fetch from Firestore 'products' collection
        // For now returning mock data
        return PRODUCTS;
    }

    async purchaseProduct(productId: string): Promise<void> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        const product = PRODUCTS.find(p => p.id === productId);
        if (!product) throw new Error('Product not found');

        // Check user coins
        const userProfile = await userService.getUserProfile(currentUser.uid);
        if (!userProfile) throw new Error('Profile not found');

        if (userProfile.coins < product.price) {
            throw new Error('Insufficient coins');
        }

        // Deduct coins
        await rewardService.deductCoins(currentUser.uid, product.price, `Purchased: ${product.name}`);

        // Record purchase
        await this.purchasesCollection.add({
            userId: currentUser.uid,
            productId,
            productName: product.name,
            price: product.price,
            status: 'completed',
            timestamp: firestore.FieldValue.serverTimestamp()
        });
    }

    async getPurchaseHistory(): Promise<Purchase[]> {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return [];

        const snapshot = await this.purchasesCollection
            .where('userId', '==', currentUser.uid)
            .orderBy('timestamp', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Purchase[];
    }
}

export default new MarketplaceService();
