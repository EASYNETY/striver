import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Switch, Image, Alert, Platform } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { ChevronLeft, Camera, Upload, ShieldAlert, Award } from 'lucide-react-native';
import squadService from '../../api/squadService';
import squadWaitlistService from '../../api/squadWaitlistService';
import userService, { UserProfile } from '../../api/userService';
import { firebaseAuth } from '../../api/firebase';
import { CAREER_TIERS } from '../../constants/rewards';
import { launchImageLibrary } from 'react-native-image-picker';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const CreateSquadScreen = ({ navigation }: any) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [capacity, setCapacity] = useState('50');
    const [kudosCost, setKudosCost] = useState('');
    const [ageRestriction, setAgeRestriction] = useState<'all' | '13+' | '18+'>('all');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userOwnedSquadsCount, setUserOwnedSquadsCount] = useState(0);
    const [waitlistStatus, setWaitlistStatus] = useState<any>(null);

    React.useEffect(() => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
            userService.getUserProfile(currentUser.uid).then(setUserProfile);
            squadService.getOwnedSquadsCount(currentUser.uid).then(setUserOwnedSquadsCount);
            squadWaitlistService.getUserRequest(currentUser.uid).then(setWaitlistStatus);
        }
    }, []);

    const handleWaitlistRequest = async () => {
        console.log('[CreateSquadScreen] handleWaitlistRequest started');

        let reason = 'User requested squad creation access'; // Default reason

        if (Platform.OS === 'ios') {
            const input = await new Promise<string | null>((resolve) => {
                Alert.prompt(
                    'Join Squad Creation Waitlist',
                    'Please tell us why you want to create a squad:',
                    [
                        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
                        { text: 'Submit', onPress: (text) => resolve(text || reason) }
                    ],
                    'plain-text'
                );
            });
            if (input === null) {
                console.log('[CreateSquadScreen] User cancelled input');
                return;
            }
            reason = input;
        } else {
            // Android fallback since Alert.prompt is not supported
            const confirmed = await new Promise<boolean>((resolve) => {
                Alert.alert(
                    'Join Squad Creation Waitlist',
                    'Submit request to create a squad?',
                    [
                        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                        { text: 'Submit', onPress: () => resolve(true) }
                    ]
                );
            });
            if (!confirmed) {
                console.log('[CreateSquadScreen] User cancelled android confirmation');
                return;
            }
        }

        setLoading(true);
        console.log('[CreateSquadScreen] Submitting request with reason:', reason);
        const result = await squadWaitlistService.submitRequest(reason);
        console.log('[CreateSquadScreen] Submit result:', result);
        setLoading(false);

        Alert.alert(
            result.success ? 'Request Submitted' : 'Request Failed',
            result.message,
            [{
                text: 'OK', onPress: () => {
                    if (result.success) {
                        const currentUser = firebaseAuth.currentUser;
                        if (currentUser) {
                            squadWaitlistService.getUserRequest(currentUser.uid).then(setWaitlistStatus);
                        }
                    }
                }
            }]
        );
    };

    const handleCreate = async () => {
        if (!userProfile) return;

        // 1. Safety Check: Junior Ballers cannot create squads
        if (userProfile.ageTier === 'junior_baller') {
            Alert.alert('Safety Restriction', 'Junior Baller accounts cannot create squads. You can still join existing child-safe squads!');
            return;
        }

        // 2. Waitlist Check: User must be approved to create squads
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
            const canCreate = await squadWaitlistService.canCreateSquad(currentUser.uid);
            if (!canCreate) {
                Alert.alert(
                    'Squad Creation Access Required',
                    waitlistStatus?.status === 'pending'
                        ? 'Your squad creation request is pending admin approval. You will be notified once approved!'
                        : waitlistStatus?.status === 'rejected'
                            ? 'Your previous squad creation request was not approved. Please contact support for more information.'
                            : 'Squad creation is currently limited. Would you like to join the waitlist?',
                    waitlistStatus?.status === 'pending' || waitlistStatus?.status === 'rejected'
                        ? [{ text: 'OK' }]
                        : [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Join Waitlist', onPress: handleWaitlistRequest }
                        ]
                );
                return;
            }
        }

        // 3. Career Tier Check: Minimum 'Academy' to create a squad
        const currentTierIndex = CAREER_TIERS.findIndex(t => t.id === userProfile.career_tier_id);
        const academyIndex = CAREER_TIERS.findIndex(t => t.id === 'academy');

        if (currentTierIndex < academyIndex) {
            Alert.alert('Tier Too Low', `You need to reach the 'Academy' tier (${CAREER_TIERS[academyIndex].threshold} Career Coins) to create a squad.`);
            return;
        }

        // 3. Squad Limit Check: Only 'Pro' and above get unlimited squads
        const proIndex = CAREER_TIERS.findIndex(t => t.id === 'pro');
        if (currentTierIndex < proIndex && userOwnedSquadsCount >= 1) {
            Alert.alert(
                'Squad Limit Reached',
                `At your current tier (${CAREER_TIERS[currentTierIndex].name}), you can only lead 1 squad. Reach 'Pro' tier for unlimited squads!`,
                [{ text: 'Upgrade Info', onPress: () => navigation.navigate('Rewards') }, { text: 'OK' }]
            );
            return;
        }

        if (!name.trim() || !description.trim()) {
            Alert.alert('Missing Info', 'Please enter a squad name and description.');
            return;
        }

        setLoading(true);
        try {
            await squadService.createSquad({
                name,
                description,
                imageUri: imageUri || undefined,
                isPrivate,
                capacity: parseInt(capacity) || 50,
                kudosCost: parseInt(kudosCost) || 0,
                ageRestriction,
            });
            Alert.alert('Success', 'Squad created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create squad. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri || null);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create New Squad</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Tier Requirements Info */}
                <View style={styles.requirementsBox}>
                    <Award color={COLORS.primary} size={20} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.requirementsTitle}>Squad Creator Requirements</Text>
                        <Text style={styles.requirementsDesc}>
                            • Reached 'Academy' Tier (100 Coins){"\n"}
                            • Age 13+ (Junior Ballers restricted){"\n"}
                            • 'Pro' status for unlimited squads
                        </Text>
                    </View>
                </View>

                {/* Image Upload */}
                <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Camera color={COLORS.textSecondary} size={32} />
                            <Text style={styles.uploadText}>Add Squad Banner</Text>
                        </View>
                    )}
                    <View style={styles.editBadge}>
                        <Upload color={COLORS.background} size={14} />
                    </View>
                </TouchableOpacity>

                {/* Form Fields */}
                <View style={styles.formSection}>
                    <Text style={styles.label}>Squad Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Manchester United Fans"
                        placeholderTextColor={COLORS.textSecondary}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="What is this squad about?"
                        placeholderTextColor={COLORS.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {/* Additional Settings */}
                <View style={styles.formSection}>
                    <Text style={styles.label}>Age Restriction</Text>
                    <Text style={[styles.settingDesc, { marginBottom: 12, marginLeft: 4 }]}>
                        Control who can join based on age for safety and compliance
                    </Text>

                    <View style={styles.ageRestrictionContainer}>
                        <TouchableOpacity
                            style={[styles.ageRestrictionBtn, ageRestriction === 'all' && styles.ageRestrictionBtnActive]}
                            onPress={() => setAgeRestriction('all')}
                        >
                            <Text style={[styles.ageRestrictionText, ageRestriction === 'all' && styles.ageRestrictionTextActive]}>
                                All Ages
                            </Text>
                            <Text style={styles.ageRestrictionSubtext}>Open to everyone</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.ageRestrictionBtn, ageRestriction === '13+' && styles.ageRestrictionBtnActive]}
                            onPress={() => setAgeRestriction('13+')}
                        >
                            <Text style={[styles.ageRestrictionText, ageRestriction === '13+' && styles.ageRestrictionTextActive]}>
                                13+
                            </Text>
                            <Text style={styles.ageRestrictionSubtext}>Academy Prospect & up</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.ageRestrictionBtn, ageRestriction === '18+' && styles.ageRestrictionBtnActive]}
                            onPress={() => setAgeRestriction('18+')}
                        >
                            <Text style={[styles.ageRestrictionText, ageRestriction === '18+' && styles.ageRestrictionTextActive]}>
                                18+
                            </Text>
                            <Text style={styles.ageRestrictionSubtext}>First Teamer only</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Privacy & Access</Text>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingTitle}>Private Squad</Text>
                            <Text style={styles.settingDesc}>Invite only via code</Text>
                        </View>
                        <Switch
                            value={isPrivate}
                            onValueChange={setIsPrivate}
                            trackColor={{ false: COLORS.surface, true: COLORS.primary }}
                            thumbColor={COLORS.white}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingTitle}>Entry Fee (Kudos)</Text>
                            <Text style={styles.settingDesc}>Points required to join</Text>
                        </View>
                        <TextInput
                            style={styles.smallInput}
                            placeholder="0"
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="numeric"
                            value={kudosCost}
                            onChangeText={setKudosCost}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingTitle}>Max Capacity</Text>
                            <Text style={styles.settingDesc}>Limit members</Text>
                        </View>
                        <TextInput
                            style={styles.smallInput}
                            placeholder="50"
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="numeric"
                            value={capacity}
                            onChangeText={setCapacity}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.createBtn, loading && styles.disabledBtn]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    <Text style={styles.createBtnText}>
                        {loading ? 'Creating...' : 'Create Squad'}
                    </Text>
                </TouchableOpacity>
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
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.display.semiBold,
        color: COLORS.white,
    },
    content: {
        padding: SPACING.lg,
    },
    requirementsBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.2)',
    },
    requirementsTitle: {
        color: COLORS.primary,
        fontFamily: FONTS.body.bold,
        fontSize: 14,
        marginBottom: 4,
    },
    requirementsDesc: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        lineHeight: 18,
        fontFamily: FONTS.body.regular,
    },
    imageUpload: {
        height: 150,
        borderRadius: 16,
        marginBottom: SPACING.xl,
        position: 'relative',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        flex: 1,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        borderRadius: 16,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    uploadText: {
        color: COLORS.textSecondary,
        marginTop: 8,
        fontFamily: FONTS.body.semiBold,
    },
    editBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 20,
    },
    formSection: {
        marginBottom: SPACING.lg,
    },
    label: {
        color: COLORS.white,
        fontFamily: FONTS.body.bold,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: COLORS.white,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        fontFamily: FONTS.body.regular,
    },
    textArea: {
        height: 100,
    },
    ageRestrictionContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    ageRestrictionBtn: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ageRestrictionBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
    },
    ageRestrictionText: {
        fontSize: 16,
        fontFamily: FONTS.display.bold,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    ageRestrictionTextActive: {
        color: COLORS.primary,
    },
    ageRestrictionSubtext: {
        fontSize: 11,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    createBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.md,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    createBtnText: {
        color: COLORS.background,
        fontSize: 18,
        fontFamily: FONTS.display.bold,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    settingTitle: {
        fontSize: 15,
        fontFamily: FONTS.body.semiBold,
        color: COLORS.white,
        marginBottom: 4,
    },
    settingDesc: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontFamily: FONTS.body.regular,
    },
    smallInput: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: COLORS.white,
        fontSize: 15,
        width: 100,
        textAlign: 'right',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        fontFamily: FONTS.body.regular,
    },
});

export default CreateSquadScreen;
