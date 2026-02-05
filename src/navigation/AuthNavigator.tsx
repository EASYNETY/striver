import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import AccountTypeScreen from '../screens/auth/AccountTypeScreen';
import SignUpMethodScreen from '../screens/auth/SignUpMethodScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import VerifyAgeScreen from '../screens/auth/VerifyAgeScreen';
import OndatoVerification from '../screens/auth/OndatoVerification';
import VerifyIdentityScreen from '../screens/auth/VerifyIdentityScreen';
import VerificationSuccessScreen from '../screens/auth/VerificationSuccessScreen';
import DateOfBirthScreen from '../screens/auth/DateOfBirthScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import InterestsSelectionScreen from '../screens/auth/InterestsSelectionScreen';
import FamilySetupScreen from '../screens/family/FamilySetupScreen';
import ChildProfileScreen from '../screens/family/ChildProfileScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="AccountType" component={AccountTypeScreen} />
            <Stack.Screen name="SignUpMethod" component={SignUpMethodScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="DateOfBirth" component={DateOfBirthScreen} />
            <Stack.Screen name="InterestsSelection" component={InterestsSelectionScreen} />
            <Stack.Screen name="VerifyAge" component={VerifyAgeScreen} />
            <Stack.Screen name="OndatoVerification" component={OndatoVerification} />
            <Stack.Screen name="VerifyIdentity" component={OndatoVerification} />
            <Stack.Screen name="VerificationSuccess" component={VerificationSuccessScreen} />
            <Stack.Screen name="FamilySetup" component={FamilySetupScreen} />
            <Stack.Screen name="ChildProfile" component={ChildProfileScreen} />
        </Stack.Navigator>
    );
};

export default AuthNavigator;
