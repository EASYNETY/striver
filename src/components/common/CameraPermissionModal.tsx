import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { Camera, X } from 'lucide-react-native';

interface CameraPermissionModalProps {
    visible: boolean;
    onAllow: () => void;
    onDeny: () => void;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
    visible,
    onAllow,
    onDeny,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onDeny}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onDeny}>
                        <X color={COLORS.textSecondary} size={24} />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Camera color={COLORS.primary} size={48} />
                        </View>
                    </View>

                    <Text style={styles.title}>Camera Access</Text>
                    <Text style={styles.message}>
                        Striver needs access to your camera to let you record and share your football skills with the community.
                    </Text>

                    <View style={styles.features}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureDot} />
                            <Text style={styles.featureText}>Record your best moments</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureDot} />
                            <Text style={styles.featureText}>Share skills with your squad</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureDot} />
                            <Text style={styles.featureText}>Get feedback from coaches</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.allowBtn} onPress={onAllow}>
                        <Text style={styles.allowBtnText}>Allow Camera Access</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.denyBtn} onPress={onDeny}>
                        <Text style={styles.denyBtnText}>Not Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    closeBtn: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        padding: 8,
        zIndex: 1,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(143, 251, 185, 0.3)',
    },
    title: {
        fontSize: 24,
        fontFamily: FONTS.display.bold,
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    message: {
        fontSize: 15,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    features: {
        marginBottom: SPACING.xl,
        gap: SPACING.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    featureDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    featureText: {
        fontSize: 14,
        fontFamily: FONTS.body.regular,
        color: COLORS.white,
    },
    allowBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    allowBtnText: {
        fontSize: 16,
        fontFamily: FONTS.display.bold,
        color: COLORS.background,
    },
    denyBtn: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    denyBtnText: {
        fontSize: 14,
        fontFamily: FONTS.body.semiBold,
        color: COLORS.textSecondary,
    },
});
