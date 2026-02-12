import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { HeartHandshake, Star, Users, Crown, ChevronRight, MessageSquare, Trophy, GraduationCap } from 'lucide-react-native';
import { firebaseAuth } from '../../api/firebase';
import userService, { UserProfile } from '../../api/userService';
import { Alert, ActivityIndicator } from 'react-native';

const FanClubScreen = ({ navigation }: any) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const currentUid = firebaseAuth.currentUser?.uid;
        if (currentUid) {
            userService.getUserProfile(currentUid).then(setProfile);
        }
    }, []);

    const handleUpgrade = () => {
        Alert.alert('Coming Soon', 'The Fan Club is currently being upgraded. Check back later!');
    };

    const handleBenefitPress = (id: string) => {
        switch (id) {
            case '1': // Legendary Squads
                navigation.navigate('SquadsTab', { premiumOnly: true });
                break;
            case '2': // Mentor Connect
                navigation.navigate('Mentors');
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
                <View style={[styles.heroCard, { backgroundColor: '#2A1A40', height: 120 }]}>
                    <View style={styles.heroText}>
                        <Text style={styles.heroTitle}>Striver Fan Club</Text>
                        <Text style={styles.heroSubtitle}>Be part of the exclusive loop of top rising stars.</Text>
                    </View>
                    <Crown color="#FFD700" size={60} style={{ position: 'absolute', right: 20, top: 30, opacity: 0.2 }} />
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
                            <Trophy color={COLORS.primary} size={20} fill={COLORS.primary} />
                            <Text style={styles.perkText}>Fan Events</Text>
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
        paddingHorizontal: SPACING.md,
        paddingTop: 80,
        paddingBottom: SPACING.md,
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
