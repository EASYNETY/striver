import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Settings } from 'react-native-fbsdk-next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { firebaseAuth, initAppCheck } from './src/api/firebase';
import userService from './src/api/userService';
import NotificationService from './src/services/notificationService';
import BackgroundUploadService from './src/services/backgroundUploadService';

// Navigators
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import ModernSplashScreen from './src/components/common/ModernSplashScreen';

// State Management (Simplified)
const Stack = createNativeStackNavigator();

const linking = {
    prefixes: ['striver://', 'https://striver-links.web.app'],
    config: {
        screens: {
            Main: {
                screens: {
                    ResponseThread: 'post/:postId',
                    Profile: 'profile/:userId',
                    SquadDetail: 'squad/:squadId',
                    MainTabs: {
                        screens: {
                            HomeFeed: 'feed',
                            SquadsTab: {
                                path: 'squads',
                                parse: {
                                    request: (active: string) => active === 'true'
                                }
                            },
                            Rewards: 'rewards',
                            Notifications: 'alerts',
                            ProfileTab: 'my-profile',
                        }
                    }
                }
            },
            Auth: 'auth',
        }
    }
} as const;

const App = () => {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [splashMinReady, setSplashMinReady] = useState(false);

    useEffect(() => {
        // Minimum time for splash to show its beautiful animations
        setTimeout(() => setSplashMinReady(true), 2500);
    }, []);

    useEffect(() => {
        // Initialize Facebook SDK
        Settings.initializeSDK();

        // Initialize App Check
        initAppCheck().catch(console.error);

        // Initialize Push Notifications
        NotificationService.initialize();

        // Initialize Background Uploads
        BackgroundUploadService.initialize();

        let profileUnsubscribe: (() => void) | null = null;

        const authUnsubscribe = firebaseAuth.onAuthStateChanged(async (u) => {
            setUser(u);

            // Clean up previous profile listener
            if (profileUnsubscribe) {
                profileUnsubscribe();
                profileUnsubscribe = null;
            }

            if (u) {
                setLoadingProfile(true);

                // Request notification permission and get FCM token
                const hasPermission = await NotificationService.requestPermission();
                if (hasPermission) {
                    await NotificationService.getFCMToken();
                }

                // Listen to profile changes in real-time
                profileUnsubscribe = userService.onProfileChange(u.uid, (profile) => {
                    setIsOnboarding(!profile?.onboardingComplete);
                    setLoadingProfile(false);
                    if (initializing) {
                        setInitializing(false);
                    }
                });
            } else {
                setIsOnboarding(false);
                setLoadingProfile(false);
                if (initializing) {
                    setInitializing(false);
                }
            }
        });

        // Safety timeout for loading profile - ensures app continues even if listeners fail
        const safetyTimeout = setTimeout(() => {
            if (loadingProfile || initializing) {
                console.warn('[App] Splash safety timeout triggered: forcing app to continue');
                setLoadingProfile(false);
                setInitializing(false);
            }
        }, 12000); // 12 seconds max splash

        return () => {
            authUnsubscribe();
            clearTimeout(safetyTimeout);
            if (profileUnsubscribe) {
                profileUnsubscribe();
            }
        };
    }, []); // Run once on mount

    if (initializing || loadingProfile || !splashMinReady) {
        return <ModernSplashScreen />;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NavigationContainer linking={linking as any}>
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        {user && !isOnboarding && !loadingProfile ? (
                            <Stack.Screen name="Main" component={MainNavigator} />
                        ) : (
                            <Stack.Screen name="Auth" component={AuthNavigator} />
                        )}
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};

export default App;
