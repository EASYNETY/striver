import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeFeedScreen from '../screens/main/HomeFeedScreen';
import SquadsScreen from '../screens/squads/SquadsScreen';
import UploadScreen from '../screens/main/UploadScreen';
import RewardsScreen from '../screens/rewards/RewardsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CommentsScreen from '../screens/main/CommentsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import CreateSquadScreen from '../screens/squads/CreateSquadScreen';
import SquadDetailScreen from '../screens/squads/SquadDetailScreen';
import ParentDashboardScreen from '../screens/family/ParentDashboardScreen';
import FamilySetupScreen from '../screens/family/FamilySetupScreen';
import ChildProfileScreen from '../screens/family/ChildProfileScreen';
import ApprovalQueueScreen from '../screens/family/ApprovalQueueScreen';
import NotificationSettingsScreen from '../screens/main/NotificationSettingsScreen';
import PrivacySettingsScreen from '../screens/main/PrivacySettingsScreen';
import LegalScreen from '../screens/main/LegalScreen';
import SupportScreen from '../screens/main/SupportScreen';
import FanClubScreen from '../screens/main/FanClubScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import FeedScreen from '../screens/main/FeedScreen';
import userService from '../api/userService';
import { firebaseAuth } from '../api/firebase';
import { COLORS } from '../constants/theme';
import { Home, Users, Camera, Star, User, Search, Bell, Newspaper, HeartHandshake } from 'lucide-react-native';


const NewsScreen = () => (
    <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <Newspaper color={COLORS.primary} size={48} />
        <Text style={{ color: COLORS.white, marginTop: 10, fontSize: 18, fontWeight: 'bold' }}>Latest Striver News Coming Soon</Text>
    </View>
);



const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
    const [profile, setProfile] = React.useState<any>(null);

    React.useEffect(() => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
            return userService.onProfileChange(currentUser.uid, (data) => {
                setProfile(data);
            });
        }
    }, []);

    const isParentInManagerMode = profile?.accountType === 'family' && !profile?.activeProfileId;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.background,
                    borderTopColor: 'rgba(255,255,255,0.1)',
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 5,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: 5,
                }
            }}
        >
            <Tab.Screen
                name="SquadsTab"
                component={SquadsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
                    tabBarLabel: 'Squads',
                }}
            />
            <Tab.Screen
                name="FanClub"
                component={FanClubScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <HeartHandshake color={color} size={size} />,
                    tabBarLabel: 'Fan Club',
                }}
            />
            <Tab.Screen
                name="HomeFeed"
                component={isParentInManagerMode ? ParentDashboardScreen : HomeFeedScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={{
                            backgroundColor: COLORS.primary,
                            borderRadius: 14,
                            width: 54,
                            height: 54,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: -15,
                            shadowColor: COLORS.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.4,
                            shadowRadius: 10,
                            elevation: 8,
                        }}>
                            <Home color={COLORS.background} size={30} strokeWidth={2.5} />
                        </View>
                    ),
                    tabBarLabel: '',
                }}
            />
            <Tab.Screen
                name="Rewards"
                component={RewardsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
                    tabBarLabel: 'Rewards',
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={AlertsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
                    tabBarLabel: 'Alerts',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

const MainNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Comments" component={CommentsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="CreateSquad" component={CreateSquadScreen} />
            <Stack.Screen name="SquadDetail" component={SquadDetailScreen} />
            <Stack.Screen name="FamilySetup" component={FamilySetupScreen} />
            <Stack.Screen name="ChildProfile" component={ChildProfileScreen} />
            <Stack.Screen name="ApprovalQueue" component={ApprovalQueueScreen} />
            <Stack.Screen name="Upload" component={UploadScreen} />
            <Stack.Screen name="Rewards" component={RewardsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
            <Stack.Screen name="Legal" component={LegalScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Feed" component={FeedScreen} />
        </Stack.Navigator>
    );
};

export default MainNavigator;
