import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Platform } from 'react-native';
import { OndatoOnAge } from '../../components/auth/OndatoOnAge';
import { COLORS, SPACING } from '../../constants/theme';
import { ShieldCheck, ChevronLeft } from 'lucide-react-native';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VerifyIdentityScreen = ({ navigation, route }: any) => {
    const insets = useSafeAreaInsets();
    const { uid, dateOfBirth } = route.params || {};

    // Note: This screen is being deprecated in favor of OndatoVerification.tsx
    // which handles the flow more robustly with polling and return-to-app sync.
    // For now, it just redirects to that screen if accessed.

    React.useEffect(() => {
        navigation.replace('OndatoVerification', { uid, dateOfBirth });
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            <View style={styles.content}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});

export default VerifyIdentityScreen;
