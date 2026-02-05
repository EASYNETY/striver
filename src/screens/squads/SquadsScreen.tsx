import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, RefreshControl, Alert } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { Search, Plus, Users, UserPlus, ShieldAlert } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import squadService, { Squad } from '../../api/squadService';
import userService from '../../api/userService';
import { firebaseAuth } from '../../api/firebase';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const SquadsScreen = ({ navigation }: any) => {
    const isFocused = useIsFocused();
    const [activeTab, setActiveTab] = useState('Explore');
    const [squads, setSquads] = useState<Squad[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [userProfile, setUserProfile] = useState<any>(null);

    const route = React.useRef(navigation.getState().routes.find((r: any) => r.name === 'SquadsTab')).current;

    useEffect(() => {
        if (isFocused) {
            const params = navigation.getState().routes.find((r: any) => r.name === 'SquadsTab')?.params;
            if (params?.initialTab) {
                setActiveTab(params.initialTab);
            }
            loadUserProfile();
            loadSquads(params?.premiumOnly);
        }
    }, [isFocused, activeTab]);

    const loadUserProfile = async () => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
            const profile = await userService.getUserProfile(currentUser.uid);
            setUserProfile(profile);
        }
    };

    const canViewSquad = (squad: Squad): boolean => {
        if (!userProfile) return true; // Show all if profile not loaded yet

        // Check age restriction
        if (squad.ageRestriction === '18+') {
            return userProfile.ageTier === 'first_teamer';
        } else if (squad.ageRestriction === '13+') {
            return userProfile.ageTier !== 'junior_baller';
        }
        return true; // 'all' age restriction
    };

    const loadSquads = async (premiumOnly = false) => {
        setLoading(true);
        try {
            let fetchedSquads: Squad[] = [];

            if (activeTab === 'Explore') {
                fetchedSquads = await squadService.getAllSquads();
                if (premiumOnly) {
                    fetchedSquads = fetchedSquads.filter(s => s.isPremium);
                }
            } else {
                const currentUser = firebaseAuth.currentUser;
                if (currentUser) {
                    fetchedSquads = await squadService.getUserSquads(currentUser.uid);
                }
            }

            setSquads(fetchedSquads);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadSquads();
    };

    const handleJoinWithCode = async () => {
        if (!inviteCode.trim()) return;

        try {
            const squadId = await squadService.joinSquadWithCode(inviteCode.trim().toUpperCase());
            Alert.alert('Success', 'You joined the private squad!');
            navigation.navigate('SquadDetail', { squadId });
            setInviteCode('');
        } catch (error) {
            Alert.alert('Error', 'Invalid invite code or already a member.');
        }
    };

    const handleCreatePress = () => {
        navigation.navigate('CreateSquad');
    };

    const handleSquadPress = (squadId: string) => {
        navigation.navigate('SquadDetail', { squadId });
    };

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Squads</Text>
                <TouchableOpacity style={styles.createBtn} onPress={handleCreatePress}>
                    <Plus color={COLORS.background} size={20} />
                    <Text style={styles.createBtnText}>Create</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
                <Search color={COLORS.textSecondary} size={20} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search squads..."
                    placeholderTextColor={COLORS.textSecondary}
                />
            </View>

            <View style={styles.tabs}>
                {['Explore', 'My Squads'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
                }
            >
                {activeTab === 'Explore' ? (
                    <Text style={styles.sectionTitle}>Trending Squads</Text>
                ) : (
                    <Text style={styles.sectionTitle}>Your Squads ({squads.length})</Text>
                )}

                {squads.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            {activeTab === 'Explore' ? 'No squads found.' : 'You haven\'t joined any squads yet.'}
                        </Text>
                    </View>
                )}

                {squads.filter(canViewSquad).map(squad => (
                    <TouchableOpacity
                        key={squad.id}
                        style={styles.squadCard}
                        onPress={() => handleSquadPress(squad.id)}
                    >
                        <Image
                            source={{ uri: squad.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400' }}
                            style={styles.squadImage}
                        />
                        <View style={styles.squadInfo}>
                            <View style={styles.squadHeader}>
                                <Text style={styles.squadName}>{squad.name}</Text>
                                {squad.ageRestriction !== 'all' && (
                                    <View style={styles.ageRestrictionBadge}>
                                        <ShieldAlert color={COLORS.background} size={10} />
                                        <Text style={styles.ageRestrictionBadgeText}>{squad.ageRestriction}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.squadDesc} numberOfLines={2}>{squad.description}</Text>
                            <View style={styles.squadStats}>
                                <View style={styles.stat}>
                                    <Users color={COLORS.textSecondary} size={14} />
                                    <Text style={styles.statText}>{squad.memberCount}</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.joinBtn}>
                            <UserPlus color={COLORS.primary} size={20} />
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}

                {activeTab === 'Explore' && (
                    <View style={styles.inviteCard}>
                        <Text style={styles.inviteTitle}>Have an invite code?</Text>
                        <Text style={styles.inviteSubtitle}>Join a private squad with your mates</Text>
                        <View style={styles.inviteInputContainer}>
                            <TextInput
                                style={styles.inviteInput}
                                placeholder="Enter Code"
                                placeholderTextColor={COLORS.textSecondary}
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity style={styles.submitCodeBtn} onPress={handleJoinWithCode}>
                                <Text style={styles.submitCodeText}>Join</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
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
        justifyContent: 'space-between',
        padding: SPACING.md,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: FONTS.display.bold,
        color: COLORS.white,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    createBtnText: {
        fontSize: 14,
        fontFamily: FONTS.display.semiBold,
        color: COLORS.background,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.md,
        paddingHorizontal: SPACING.md,
        height: 48,
        borderRadius: 12,
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    searchInput: {
        flex: 1,
        color: COLORS.white,
        fontSize: 15,
        fontFamily: FONTS.body.regular,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.md,
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    tab: {
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 16,
        fontFamily: FONTS.display.medium,
        color: COLORS.textSecondary,
    },
    tabTextActive: {
        color: COLORS.primary,
    },
    content: {
        padding: SPACING.md,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: FONTS.display.semiBold,
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    squadCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.sm,
        marginBottom: SPACING.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    squadImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: COLORS.background,
    },
    squadInfo: {
        flex: 1,
        marginLeft: SPACING.md,
        marginRight: SPACING.sm,
    },
    squadHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    squadName: {
        fontSize: 16,
        fontFamily: FONTS.display.semiBold,
        color: COLORS.white,
    },
    ageRestrictionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF9500',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    ageRestrictionBadgeText: {
        fontSize: 8,
        fontFamily: FONTS.display.bold,
        color: COLORS.background,
    },
    squadDesc: {
        fontSize: 13,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    squadStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
    },
    joinBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inviteCard: {
        padding: SPACING.lg,
        backgroundColor: 'rgba(143, 251, 185, 0.05)',
        borderRadius: 20,
        marginTop: SPACING.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.1)',
    },
    inviteTitle: {
        fontSize: 18,
        fontFamily: FONTS.display.bold,
        color: COLORS.white,
    },
    inviteSubtitle: {
        fontSize: 13,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
        marginTop: 4,
        marginBottom: SPACING.lg,
    },
    inviteInputContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    inviteInput: {
        flex: 1,
        height: 48,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        color: COLORS.white,
        fontSize: 15,
        fontFamily: FONTS.body.regular,
    },
    submitCodeBtn: {
        paddingHorizontal: 20,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitCodeText: {
        fontFamily: FONTS.display.semiBold,
        color: COLORS.background,
    },
    emptyState: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontFamily: FONTS.body.regular,
    },
});

export default SquadsScreen;
