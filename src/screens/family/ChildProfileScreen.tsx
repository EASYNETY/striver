import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, User, ShieldCheck } from 'lucide-react-native';
import userService from '../../api/userService';

const ChildProfileScreen = ({ navigation, route }: any) => {
    const { uid } = route.params || {};
    const [firstName, setFirstName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [dob, setDob] = useState('');
    const [favTeam, setFavTeam] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!firstName || !displayName || !dob) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await userService.addChildProfile(uid, {
                firstName,
                displayName,
                dob,
                favTeam
            });
            Alert.alert('Success', 'Child profile created!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create child profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={COLORS.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Child Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarPlaceholder}>
                    <User color={COLORS.textSecondary} size={48} />
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Child's first name"
                        placeholderTextColor={COLORS.textSecondary}
                        value={firstName}
                        onChangeText={setFirstName}
                    />

                    <Text style={styles.label}>Display Name (Public)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Junior Striker"
                        placeholderTextColor={COLORS.textSecondary}
                        value={displayName}
                        onChangeText={setDisplayName}
                    />

                    <Text style={styles.label}>Date of Birth</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor={COLORS.textSecondary}
                        value={dob}
                        onChangeText={setDob}
                    />

                    <Text style={styles.label}>Favorite Team (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Select team"
                        placeholderTextColor={COLORS.textSecondary}
                        value={favTeam}
                        onChangeText={setFavTeam}
                    />
                </View>

                <View style={styles.safetyBox}>
                    <View style={styles.safetyHeader}>
                        <ShieldCheck color={COLORS.primary} size={20} />
                        <Text style={styles.safetyTitle}>Safety Defaults Applied</Text>
                    </View>
                    <Text style={styles.safetyText}>
                        Since this is a child profile (Ages 4-12), the following safety settings will be applied automatically:
                    </Text>
                    <View style={styles.safetyList}>
                        <Text style={styles.safetyItem}>• Account is 100% Private</Text>
                        <Text style={styles.safetyItem}>• Direct Messages Disabled</Text>
                        <Text style={styles.safetyItem}>• Comments Disabled on posts</Text>
                        <Text style={styles.safetyItem}>• Restricted Social Discovery</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.saveBtnText}>Create Profile</Text>}
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
        marginLeft: SPACING.sm,
    },
    content: {
        padding: SPACING.lg,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.surface,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    form: {
        gap: SPACING.md,
    },
    label: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: -8,
    },
    input: {
        height: 52,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
        color: COLORS.white,
        fontSize: 16,
    },
    safetyBox: {
        marginTop: SPACING.xxl,
        padding: SPACING.md,
        backgroundColor: 'rgba(143, 251, 185, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.1)',
    },
    safetyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    safetyTitle: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    safetyText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
    safetyList: {
        marginTop: 12,
        gap: 4,
    },
    safetyItem: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '500',
    },
    footer: {
        padding: SPACING.lg,
    },
    saveBtn: {
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.background,
    },
});

export default ChildProfileScreen;
