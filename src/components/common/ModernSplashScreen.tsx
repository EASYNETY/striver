import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar, useWindowDimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

// Striver Logo SVG Content
const STRIVER_SVG = `
<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1080" fill="#8ffbb9"/>
  <g>
    <path d="M151.66,587.69c0,4.59-.71,8.83-2.47,14.13l-8.12,22.61c-4.24,11.3-.71,19.78,7.77,19.78s14.13-6.36,18.02-16.6c6.71-17.67,4.59-32.5-5.65-69.6l-2.83-10.6c-8.83-32.86-14.48-64.3-3.89-93.97,14.48-39.92,39.92-58.29,74.9-58.29,39.21,0,61.47,32.15,44.16,80.9-2.83,7.77-4.95,13.78-4.95,19.78h-46.63c0-5.3.35-10.24,3.18-17.66l9.19-25.44c4.24-11.3-.71-16.96-8.12-16.96-9.54,0-14.84,6.71-19.43,19.43-7.07,19.78-.35,47.69,4.59,66.06l2.83,10.6c9.19,34.27,16.6,65,4.95,96.8-14.84,40.27-42.75,56.17-75.6,56.17-40.63,0-59.7-32.86-44.16-77.01,3.89-10.95,4.94-15.19,5.3-20.14h46.99Z" fill="#0b1129"/>
    <path d="M424.39,398.69l-16.6,45.93h-35.33l-86.2,236.7h-52.99l86.2-236.7h-35.33l16.6-45.93h123.65Z" fill="#0b1129"/>
    <path d="M485.15,398.69c39.57,0,67.12,36.74,43.45,101.39-10.95,30.03-28.62,50.87-56.52,68.89l-12.37,112.34h-51.93l18.02-104.22h-5.3l-35.68,104.22h-52.99l102.8-282.62h50.52ZM436.75,538.23h3.18c12.72,0,22.96-5.65,28.62-20.49l16.96-45.57c8.48-22.61-.35-31.09-11.3-31.09h-2.12l-35.33,97.15Z" fill="#0b1129"/>
    <path d="M628.58,398.69l-102.8,282.62h-52.99l102.8-282.62h52.99Z" fill="#0b1129"/>
    <path d="M637.05,398.69h52.28l-44.16,150.14h3.53l65.35-150.14h52.29v3.53l-129.65,279.09h-74.19l74.54-282.62Z" fill="#0b1129"/>
    <path d="M871.98,398.69l-16.96,45.93h-42.39l-25.43,70.66h37.09l-16.96,45.93h-37.09l-26.85,74.19h42.39l-16.6,45.93h-95.38l102.8-282.62h95.39Z" fill="#0b1129"/>
    <path d="M933.8,398.69c39.57,0,67.12,36.74,43.45,101.39-10.95,30.03-28.62,50.87-56.52,68.89l-12.37,112.34h-51.93l18.02-104.22h-5.3l-35.68,104.22h-52.99l102.8-282.62h50.52ZM885.4,538.23h3.18c12.72,0,22.96-5.65,28.62-20.49l16.96-45.57c8.48-22.61-.35-31.09-11.3-31.09h-2.12l-35.33,97.15Z" fill="#0b1129"/>
  </g>
</svg>
`;

const ModernSplashScreen = () => {
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

    // Animation refs
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;

    const textOpacity = useRef(new Animated.Value(0)).current;
    const progressBar = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entry animation sequence
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            })
        ]).start();

        // Staggered text appearance
        Animated.timing(textOpacity, {
            toValue: 1,
            duration: 800,
            delay: 800,
            useNativeDriver: true,
        }).start();

        // Continuous pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ])
        ).start();

        // Progress bar simulation
        Animated.timing(progressBar, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: false,
        }).start();
    }, []);

    const progressWidth = progressBar.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const dynamicStyles = StyleSheet.create({
        glow: {
            position: 'absolute',
            width: SCREEN_WIDTH * 1.5,
            height: SCREEN_WIDTH * 1.5,
            backgroundColor: 'rgba(143, 251, 185, 0.03)',
            borderRadius: SCREEN_WIDTH,
        }
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View style={dynamicStyles.glow} />

            <Animated.View style={[
                styles.content,
                {
                    opacity: fadeAnim,
                    transform: [
                        { scale: scaleAnim },
                        { translateY: translateY }
                    ]
                }
            ]}>
                <View style={styles.logoBox}>
                    <Text style={styles.logoText}>STRIVER</Text>
                </View>

                {/* Loading Elements */}
                <View style={{ alignItems: 'center' }}>
                    <Animated.View style={[styles.progressBar, {
                        width: progressBar.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200]
                        })
                    }]} />
                    <Text style={styles.loadingText}>PREPARING YOUR ARENA...</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050A18', // Ultra Dark Navy
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoBox: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 15,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0B1129', // Dark Navy
        letterSpacing: 1,
        fontFamily: 'Montserrat-Bold',
        fontStyle: 'italic',
    },
    loadingText: {
        marginTop: 40,
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255, 255, 255, 0.3)',
        letterSpacing: 2,
    },
    progressBar: {
        height: 2,
        backgroundColor: COLORS.primary,
        width: 200,
        marginTop: 20,
        borderRadius: 1,
    },
});

export default ModernSplashScreen;
