import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Switch, Image, Alert } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, Camera, Upload } from 'lucide-react-native';
import squadService from '../../api/squadService';
// import { launchImageLibrary } from 'react-native-image-picker'; // In production

const CreateSquadScreen = ({ navigation }: any) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [price, setPrice] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [capacity, setCapacity] = useState('50');
    const [kudosCost, setKudosCost] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim() || !description.trim()) {
            Alert.alert('Missing Info', 'Please enter a squad name and description.');
            return;
        }

        if (isPremium && !price.trim()) {
            Alert.alert('Missing Info', 'Please set a monthly subscription price.');
            return;
        }

        setLoading(true);
        try {
            await squadService.createSquad({
                name,
                description,
                imageUri: imageUri || undefined,
                isPremium,
                price: isPremium ? price : undefined,
                isPrivate,
                capacity: parseInt(capacity) || 50,
                kudosCost: parseInt(kudosCost) || 0,
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
        // Mock image picker for now
        Alert.alert('Select Image', 'Image picker would open here in production', [
            { text: 'Use Placeholder', onPress: () => setImageUri('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=500') },
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create New Squad</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
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

                {/* Premium Toggle */}
                <View style={styles.premiumContainer}>
                    <View style={styles.premiumHeader}>
                        <Text style={styles.premiumTitle}>Premium Squad</Text>
                        <Switch
                            value={isPremium}
                            onValueChange={setIsPremium}
                            trackColor={{ false: COLORS.surface, true: COLORS.primary }}
                            thumbColor={COLORS.white}
                        />
                    </View>
                    <Text style={styles.premiumDesc}>
                        Premium squads can solve exclusive challenges and earn more rewards. Charge a monthly fee for entry.
                    </Text>

                    {isPremium && (
                        <View style={styles.priceInputContainer}>
                            <Text style={styles.currencySymbol}>£</Text>
                            <TextInput
                                style={styles.priceInput}
                                placeholder="4.99"
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                            />
                            <Text style={styles.perMonth}>/ month</Text>
                        </View>
                    )}
                </View>

                {/* Additional Settings */}
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
        fontWeight: '700',
        color: COLORS.white,
    },
    content: {
        padding: SPACING.lg,
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
        fontWeight: '600',
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
        fontWeight: '700',
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
    },
    textArea: {
        height: 100,
    },
    premiumContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.xl,
    },
    premiumHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    premiumTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
    premiumDesc: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
        marginBottom: 12,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    currencySymbol: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        marginRight: 4,
    },
    priceInput: {
        flex: 1,
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        padding: 0,
    },
    perMonth: {
        color: COLORS.textSecondary,
        fontSize: 14,
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
        fontWeight: '700',
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
        fontWeight: '600',
        color: COLORS.white,
        marginBottom: 4,
    },
    settingDesc: {
        fontSize: 12,
        color: COLORS.textSecondary,
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
    },
});

export default CreateSquadScreen;
