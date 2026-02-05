import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { HeartHandshake, Star, Users, Crown, ChevronRight, MessageSquare, Trophy, GraduationCap } from 'lucide-react-native';
import { firebaseAuth } from '../../api/firebase';
import userService, { UserProfile } from '../../api/userService';
import paymentService from '../../api/paymentService';
import { Alert, ActivityIndicator } from 'react-native';

const FanClubScreen = ({ navigation }: any) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        const currentUid = firebaseAuth.currentUser?.uid;
        if (currentUid) {
            userService.getUserProfile(currentUid).then(setProfile);
        }
    }, []);

    const handleUpgrade = async () => {
        try {
            setPaying(true);
            // In real app, priceId would come from Stripe Dashboard
            // For demo, we use amount-based payment
            await paymentService.initializePaymentSheet(999, 'gbp', 'Striver Pro Monthly Subscription');
            const success = await paymentService.openPaymentSheet();

            if (success) {
                Alert.alert('Welcome to Pro!', 'Your account has been upgraded. You now have the Pro Badge and 2x Coins enabled.');
                // In production, backend webhook would update firestore. 
                // Here we optimistically update UI if we want, or rely on profile listener.
            }
        } catch (error: any) {
            if (error.message !== 'The user cancelled the payment sheet') {
                Alert.alert('Payment Error', error.message);
            }
        } finally {
            setPaying(false);
        }
    };

    const handleBenefitPress = (id: string) => {
        switch (id) {
            case '1': // Legendary Squads
                navigation.navigate('SquadsTab', { premiumOnly: true });
                break;
            case '2': // Mentor Connect
                // Navigate to mentor/coaching section (to be implemented)
                Alert.alert('Mentor Connect', 'Connect with verified coaches and mentors to improve your skills. Coming soon!');
                break;
            case '3': // Exclusive Rewards
                navigation.navigate('Rewards');
                break;
        }
    };

    const sections = [
        {
            id: '1',
            title: 'Legendary Squads',
            subtitle: 'Join the world\'s best academy squads',
            icon: <Crown color="#FFD700" size={24} />,
            color: '#rgba(255, 215, 0, 0.1)'
        },
        {
            id: '2',
            title: 'Mentor Connect',
            subtitle: 'Learn from verified coaches and mentors',
            icon: <GraduationCap color={COLORS.primary} size={24} />,
            color: 'rgba(143, 251, 185, 0.1)'
        },
        {
            id: '3',
            title: 'Exclusive Rewards',
            subtitle: 'Redeem coins for physical gear and cards',
            icon: <Trophy color="#FF9500" size={24} />,
            color: 'rgba(255, 149, 0, 0.1)'
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <HeartHandshake color={COLORS.primary} size={32} />
                <Text style={styles.headerTitle}>Fan Club</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                    <View style={styles.heroText}>
                        <Text style={styles.heroTitle}>Upgrade to Pro</Text>
                        <Text style={styles.heroSubtitle}>Unlock all premium features and get verified.</Text>
                        <TouchableOpacity
                            style={[styles.heroBtn, paying && { opacity: 0.7 }]}
                            onPress={handleUpgrade}
                            disabled={paying}
                        >
                            {paying ? (
                                <ActivityIndicator size="small" color={COLORS.background} />
                            ) : (
                                <Text style={styles.heroBtnText}>Upgrade Now</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400' }}
                        style={styles.heroImage}
                    />
                </View>

                <Text style={styles.sectionTitle}>Exclusive Benefits</Text>
                {sections.map(section => (
                    <TouchableOpacity
                        key={section.id}
                        style={[styles.benefitCard, { backgroundColor: section.color }]}
                        onPress={() => handleBenefitPress(section.id)}
                    >
                        <View style={styles.benefitIcon}>{section.icon}</View>
                        <View style={styles.benefitInfo}>
                            <Text style={styles.benefitTitle}>{section.title}</Text>
                            <Text style={styles.benefitSubtitle}>{section.subtitle}</Text>
                        </View>
                        <ChevronRight color={COLORS.textSecondary} size={20} />
                    </TouchableOpacity>
                ))}

                <View style={styles.perksContainer}>
                    <Text style={styles.sectionTitle}>Daily Perks</Text>
                    <View style={styles.perkRow}>
                        <View style={styles.perkItem}>
                            <Star color={COLORS.primary} size={20} fill={COLORS.primary} />
                            <Text style={styles.perkText}>2x Coins</Text>
                        </View>
                        <View style={styles.perkItem}>
                            <MessageSquare color={COLORS.primary} size={20} fill={COLORS.primary} />
                            <Text style={styles.perkText}>Pro Badge</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        gap: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.white,
    },
    content: {
        padding: SPACING.md,
    },
    heroCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        height: 180,
        flexDirection: 'row',
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    heroText: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.primary,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    heroBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    heroBtnText: {
        color: COLORS.background,
        fontWeight: 'bold',
        fontSize: 12,
    },
    heroImage: {
        width: '40%',
        height: '100%',
        opacity: 0.8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: 16,
        marginTop: 8,
    },
    benefitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    benefitInfo: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: 4,
    },
    benefitSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    perksContainer: {
        marginTop: 12,
    },
    perkRow: {
        flexDirection: 'row',
        gap: 12,
    },
    perkItem: {
        flex: 1,
        backgroundColor: COLORS.surface,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        gap: 10,
    },
    perkText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 14,
    }
});

export default FanClubScreen;
