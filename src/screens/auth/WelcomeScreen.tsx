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

        // If user is already logged in but stuck here (onboarding incomplete)
        // Redirect them to the next relevant step
        const user = firebaseAuth.currentUser;
        if (user) {
            navigation.navigate('OTPVerification', { uid: user.uid });
        }
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
                    ignoreSilentBadge={true}
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
                    <Text style={styles.appName}>striver</Text>
                    <View style={styles.taglineRow}>
                        <Trophy color={COLORS.primary} size={14} />
                        <Text style={styles.taglineText}>THE FUTURE OF FOOTBALL</Text>
                    </View>
                </View>

                <View style={styles.ctaContainer}>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => navigation.navigate('AccountType')}
                    >
                        <Text style={styles.primaryBtnText}>Sign Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => navigation.navigate('SignUp', { mode: 'login' })}
                    >
                        <Text style={styles.secondaryBtnText}>Login</Text>
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
    videoPlaceholder: {
        flex: 1,
        backgroundColor: '#151c3a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoText: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 18,
        fontWeight: '700',
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
        fontFamily: FONTS.bold,
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
        fontSize: 12,
        fontFamily: FONTS.medium,
        color: COLORS.white,
        fontWeight: '700',
        letterSpacing: 2,
    },
    ctaContainer: {
        gap: SPACING.md,
        marginBottom: SPACING.xxl,
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
        fontWeight: '700',
        color: COLORS.white,
    },
});

export default WelcomeScreen;
