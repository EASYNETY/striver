import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, Camera, Check } from 'lucide-react-native';
import userService, { UserProfile } from '../../api/userService';
import { firebaseAuth } from '../../api/firebase';
import { launchImageLibrary } from 'react-native-image-picker';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

const EditProfileScreen = ({ navigation }: any) => {
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [favoriteTeam, setFavoriteTeam] = useState('');
    const [avatar, setAvatar] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const profile = await userService.getCurrentUserProfile();
        if (profile) {
            setDisplayName(profile.displayName || '');
            setUsername(profile.username || '');
            setBio(profile.bio || '');
            setFavoriteTeam(profile.favoriteTeam || '');
            setAvatar(profile.avatar || '');
        }
        setInitialLoading(false);
    };

    const handlePickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            if (uri && firebaseAuth.currentUser) {
                setUploading(true);
                try {
                    const newUrl = await userService.uploadAvatar(firebaseAuth.currentUser.uid, uri);
                    setAvatar(newUrl);
                    Alert.alert('Success', 'Profile picture updated!');
                } catch (error) {
                    Alert.alert('Error', 'Failed to upload image');
                } finally {
                    setUploading(true); // Wait, should be false
                    setUploading(false);
                }
            }
        }
    };

    const handleSave = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Username cannot be empty');
            return;
        }

        setLoading(true);
        try {
            const currentUser = firebaseAuth.currentUser;
            if (currentUser) {
                await userService.updateUserProfile(currentUser.uid, {
                    displayName,
                    username,
                    bio,
                    favoriteTeam,
                });
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    <Check color={COLORS.primary} size={28} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity style={styles.avatarSection} onPress={handlePickImage} disabled={uploading}>
                    <View style={styles.avatarContainer}>
                        {uploading ? (
                            <View style={[styles.avatar, styles.uploadingOverlay]}>
                                <ActivityIndicator color={COLORS.primary} />
                            </View>
                        ) : (
                            <Image
                                source={{ uri: avatar || `https://ui-avatars.com/api/?name=${username}` }}
                                style={styles.avatar}
                            />
                        )}
                        <View style={styles.cameraBadge}>
                            <Camera color={COLORS.white} size={16} />
                        </View>
                    </View>
                    <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                </TouchableOpacity>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Display Name</Text>
                        <TextInput
                            style={styles.input}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Your Name"
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="username"
                            placeholderTextColor={COLORS.textSecondary}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell us about yourself..."
                            placeholderTextColor={COLORS.textSecondary}
                            multiline
                            maxLength={150}
                        />
                        <Text style={styles.charCount}>{bio.length}/150</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Favorite Team</Text>
                        <TextInput
                            style={styles.input}
                            value={favoriteTeam}
                            onChangeText={setFavoriteTeam}
                            placeholder="e.g. Manchester United, Barcelona..."
                            placeholderTextColor={COLORS.textSecondary}
                        />
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
    avatarSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: COLORS.surface,
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    changePhotoText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    form: {
        gap: SPACING.lg,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
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
        textAlignVertical: 'top',
    },
    charCount: {
        alignSelf: 'flex-end',
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    uploadingOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    }
});

export default EditProfileScreen;
