import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import Video from 'react-native-video';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { Trophy } from 'lucide-react-native';
import { logEvent, EVENTS } from '../../utils/analytics';
import { firebaseAuth } from '../../api/firebase';

const WelcomeScreen = ({ navigation }: any) => {
    useEffect(() => {
        logEvent(EVENTS.FIRST_OPEN);

        // Smarter redirect for users returning to the app mid-onboarding
        const checkStatusAndRedirect = async () => {
            const user = firebaseAuth.currentUser;
            if (user) {
                // If they have a phone number, they are already verified
                if (user.phoneNumber) {
                    navigation.navigate('DateOfBirth', { uid: user.uid, signupMethod: 'phone' });
                } else if (user.email && !user.emailVerified) {
                    // Only email users who aren't verified yet should go here
                    navigation.navigate('OTPVerification', { uid: user.uid, email: user.email, verificationMethod: 'email' });
                } else {
                    // Default fallback
                    navigation.navigate('AccountType');
                }
            }
        };

        checkStatusAndRedirect();
    }, [navigation]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Hero Video Background (9x19) */}
            <View style={styles.videoContainer}>
                <Video
                    source={require('../../../assets/videos/gs_intro.mp4')}
                    style={styles.backgroundVideo}
                    muted={true}
                    repeat={true}
                    resizeMode="cover"
                    playInBackground={true}
                    playWhenInactive={true}
                    rate={1.0}
                />
                <View style={[styles.overlay, { backgroundColor: 'rgba(10, 17, 40, 0.7)' }]} />
            </View>

            <View style={styles.overlay}>
                <View style={styles.logoContainer}>
                    <View style={styles.brandingBox}>
                        <View style={styles.logoBox}>
                            <Image
                                source={require('../../../assets/images/icon.png')}
                                style={styles.logoImage}
                            />
                        </View>
                        <View style={styles.logoShadow} />
                    </View>
                    {/* <Text style={styles.appName}>striver</Text> */}
                    <View style={styles.taglineRow}>
                        <Trophy color={COLORS.primary} size={14} />
                        <Text style={styles.taglineText}>FOOTBALL HAS A NEW VOICE</Text>
                    </View>
                </View>

                <View style={styles.ctaContainer}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.primaryBtn}
                        onPress={() => navigation.navigate('AccountType')}
                    >
                        <Text style={styles.primaryBtnText}>Sign Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.secondaryBtn}
                        onPress={() =>
                            navigation.navigate('SignUp', {
                                mode: 'login',
                                accountType: 'individual',
                            })
                        }
                    >
                        <Text style={styles.secondaryBtnText}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    videoContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    backgroundVideo: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        flex: 1,
        padding: SPACING.xl,
        justifyContent: 'space-between',
        backgroundColor: 'rgba(10, 17, 40, 0.6)',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 120,
    },
    brandingBox: {
        position: 'relative',
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    logoBox: {
        width: 100,                   // optional: make circle slightly bigger
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',           // crucial
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        // ... shadows ...
    },

    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    logoShadow: {
        position: 'absolute',
        bottom: 5,
        width: 60,
        height: 10,
        // backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        transform: [{ scaleX: 1.5 }],
    },
    appName: {
        fontSize: 56,
        fontWeight: '900',
        fontFamily: FONTS.display.bold,
        color: COLORS.white,
        letterSpacing: -3,
        textTransform: 'lowercase',
    },
    taglineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    taglineText: {
        fontSize: 16,
        fontFamily: FONTS.body.regular,
        color: COLORS.white,
        marginTop: 8,
        opacity: 0.9,
    },
    ctaContainer: {
        gap: SPACING.md,
        marginBottom: SPACING.xxl,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.sm,
        gap: 12,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dividerText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    primaryBtn: {
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        fontSize: 18,
        fontFamily: FONTS.display.medium,
        fontWeight: '700',
        color: COLORS.background,
    },
    secondaryBtn: {
        height: 56,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.5)',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryBtnText: {
        fontSize: 18,
        fontFamily: FONTS.display.medium,
        fontWeight: '700',
        color: COLORS.white,
    },
    textBtn: {
        paddingVertical: SPACING.md,
        alignItems: 'center',
    },
    textBtnText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    textBtnHighlight: {
        color: COLORS.primary,
        fontWeight: '700',
    },
});

export default WelcomeScreen;
