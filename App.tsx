import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Settings } from 'react-native-fbsdk-next';
import { firebaseAuth, initAppCheck } from './src/api/firebase';
import userService from './src/api/userService';

// Navigators
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import ModernSplashScreen from './src/components/common/ModernSplashScreen';

// State Management (Simplified)
const Stack = createNativeStackNavigator();

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

        let profileUnsubscribe: (() => void) | null = null;

        const authUnsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
            setUser(user);

            // Clean up previous profile listener
            if (profileUnsubscribe) {
                profileUnsubscribe();
                profileUnsubscribe = null;
            }

            if (user) {
                setLoadingProfile(true);
                // Listen to profile changes in real-time
                profileUnsubscribe = userService.onProfileChange(user.uid, (profile) => {
                    setIsOnboarding(!profile?.onboardingComplete);
                    setLoadingProfile(false);
                    if (initializing) setInitializing(false);
                });
            } else {
                setIsOnboarding(false);
                setLoadingProfile(false);
                if (initializing) setInitializing(false);
            }
        });

        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        };
    }, []);

    if (initializing || loadingProfile || !splashMinReady) return <ModernSplashScreen />;

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {user && !isOnboarding && !loadingProfile ? (
                        <Stack.Screen name="Main" component={MainNavigator} />
                    ) : (
                        <Stack.Screen name="Auth" component={AuthNavigator} />
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
