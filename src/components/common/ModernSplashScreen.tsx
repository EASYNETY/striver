import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image, StatusBar } from 'react-native';
import { COLORS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const ModernSplashScreen = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const circle1Scale = useRef(new Animated.Value(0)).current;
    const circle2Scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Main logo animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 10000,
                    useNativeDriver: true,
                })
            )
        ]).start();

        // Background circle animations (staggered)
        Animated.loop(
            Animated.sequence([
                Animated.timing(circle1Scale, {
                    toValue: 1.5,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(circle1Scale, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        setTimeout(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(circle2Scale, {
                        toValue: 1.2,
                        duration: 3500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(circle2Scale, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, 1000);
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Animated Background Elements */}
            <Animated.View style={[
                styles.circle,
                { transform: [{ scale: circle1Scale }], opacity: 0.1 }
            ]} />
            <Animated.View style={[
                styles.circle,
                { transform: [{ scale: circle2Scale }], opacity: 0.05, width: 400, height: 400 }
            ]} />

            <Animated.View style={[
                styles.logoContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }
            ]}>
                {/* We'll use a placeholder or the generated logo if we could, 
                    but for now a stylized S/Football combo matches the prompt */}
                <View style={styles.logoCircle}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Image
                            source={require('../../assets/images/striver_logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </View>

                <Text style={styles.appName}>STRIVER</Text>
                <Text style={styles.tagline}>THE FUTURE OF FOOTBALL</Text>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>BE THE BEST</Text>
                <View style={styles.loadingBarContainer}>
                    <Animated.View style={styles.loadingBar} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: COLORS.primary,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.2)',
    },
    logoImage: {
        width: 100,
        height: 100,
    },
    appName: {
        fontSize: 42,
        fontWeight: '900',
        color: COLORS.white,
        letterSpacing: 8,
    },
    tagline: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
        letterSpacing: 4,
        marginTop: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
        marginBottom: 16,
    },
    loadingBarContainer: {
        width: 200,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    loadingBar: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.primary,
    },
});

export default ModernSplashScreen;
