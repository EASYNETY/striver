import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { CheckCircle2, Search, ArrowRight } from 'lucide-react-native';
import userService from '../../api/userService';
import { logEvent, EVENTS } from '../../utils/analytics';

const INTERESTS = [
    'Skills & Tricks', 'Match Highlights', 'Training Drills', 'Transfer News',
    'Street Football', 'Gaming', 'Boots & Gear', 'Tactics', 'Fan Reactions'
];

const PLAYERS = [
    { id: '1', name: 'V. Junior', team: 'Real Madrid', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vinicius' },
    { id: '2', name: 'L. Messi', team: 'Inter Miami', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=messi' },
    { id: '3', name: 'K. Mbappe', team: 'Real Madrid', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mbappe' },
    { id: '4', name: 'E. Haaland', team: 'Man City', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=haaland' },
];

const InterestsSelectionScreen = ({ navigation, route }: any) => {
    const { uid } = route.params || {};
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        );
    };

    const togglePlayer = (playerId: string) => {
        setSelectedPlayers(prev =>
            prev.includes(playerId) ? prev.filter(i => i !== playerId) : [...prev, playerId]
        );
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            await userService.updateUserProfile(uid, {
                onboardingComplete: true
            });
            logEvent(EVENTS.ONBOARDING_COMPLETED);
            // Navigation is handled by App.tsx listener
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Personalize</Text>
                <Text style={styles.headerSubtitle}>Choose what you want to see</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.interestsGrid}>
                    {INTERESTS.map(interest => {
                        const isSelected = selectedInterests.includes(interest);
                        return (
                            <TouchableOpacity
                                key={interest}
                                style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                                onPress={() => toggleInterest(interest)}
                            >
                                <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>
                                    {interest}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.sectionTitle}>Follow Your Idols</Text>
                <View style={styles.playersList}>
                    {PLAYERS.map(player => {
                        const isSelected = selectedPlayers.includes(player.id);
                        return (
                            <TouchableOpacity
                                key={player.id}
                                style={[styles.playerCard, isSelected && styles.playerCardSelected]}
                                onPress={() => togglePlayer(player.id)}
                            >
                                <Image source={{ uri: player.image }} style={styles.playerImage} />
                                <View style={styles.playerInfo}>
                                    <Text style={styles.playerName}>{player.name}</Text>
                                    <Text style={styles.playerTeam}>{player.team}</Text>
                                </View>
                                {isSelected ? (
                                    <CheckCircle2 color={COLORS.primary} size={24} />
                                ) : (
                                    <View style={styles.playerAdd}>
                                        <Text style={styles.playerAddText}>+</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.finishBtn}
                    onPress={handleFinish}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.background} />
                    ) : (
                        <>
                            <Text style={styles.finishBtnText}>Finish Setup</Text>
                            <ArrowRight color={COLORS.background} size={20} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: SPACING.lg,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.white,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    content: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
        marginTop: SPACING.xl,
        marginBottom: SPACING.md,
    },
    interestsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    interestChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    interestChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    interestText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    interestTextSelected: {
        color: COLORS.background,
    },
    playersList: {
        gap: 10,
    },
    playerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    playerCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(143, 251, 185, 0.05)',
    },
    playerImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    playerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    playerName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
    playerTeam: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    playerAdd: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerAddText: {
        color: COLORS.white,
        fontSize: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.lg,
        backgroundColor: COLORS.background,
    },
    finishBtn: {
        flexDirection: 'row',
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    finishBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.background,
    },
});

export default InterestsSelectionScreen;
