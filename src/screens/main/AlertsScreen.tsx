import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { Bell, Heart, MessageSquare, UserPlus, Trophy, ChevronRight, Star } from 'lucide-react-native';
import { firebaseAuth, db } from '../../api/firebase';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

interface Alert {
    id: string;
    type: 'like' | 'comment' | 'follow' | 'reward' | 'squad';
    title: string;
    message: string;
    timestamp: any;
    read: boolean;
    fromUser?: {
        uid: string;
        username: string;
        avatar: string;
    };
    relatedId?: string;
}

const AlertsScreen = ({ navigation }: any) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return;

        // In a real app, this would be a Firestore listener on a 'notifications' collection
        const unsubscribe = db.collection('users').doc(currentUser.uid).collection('notifications')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot(snapshot => {
                const fetchedAlerts: Alert[] = [];
                snapshot.forEach(doc => {
                    fetchedAlerts.push({ id: doc.id, ...doc.data() } as Alert);
                });

                // If no real data yet, provide some mock data for the USER to see the design
                if (fetchedAlerts.length === 0) {
                    setAlerts([
                        {
                            id: 'mock1',
                            type: 'like',
                            title: 'New Like',
                            message: 'Messi liked your video!',
                            timestamp: { toDate: () => new Date() },
                            read: false,
                            fromUser: { uid: '1', username: 'messi', avatar: 'https://via.placeholder.com/100' }
                        },
                        {
                            id: 'mock2',
                            type: 'reward',
                            title: 'Coins Earned',
                            message: 'You earned 50 coins for the Legend Challenge!',
                            timestamp: { toDate: () => new Date(Date.now() - 3600000) },
                            read: true,
                        },
                        {
                            id: 'mock3',
                            type: 'follow',
                            title: 'New Follower',
                            message: 'Neymar started following you.',
                            timestamp: { toDate: () => new Date(Date.now() - 86400000) },
                            read: true,
                            fromUser: { uid: '2', username: 'neymarjr', avatar: 'https://via.placeholder.com/100' }
                        }
                    ]);
                } else {
                    setAlerts(fetchedAlerts);
                }
                setLoading(false);
            }, error => {
                console.error('Alerts Error:', error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart color="#FF4B4B" size={20} fill="#FF4B4B" />;
            case 'comment': return <MessageSquare color={COLORS.primary} size={20} />;
            case 'follow': return <UserPlus color="#4B7BFF" size={20} />;
            case 'reward': return <Star color="#FFD700" size={20} fill="#FFD700" />;
            case 'squad': return <Trophy color={COLORS.primary} size={20} />;
            default: return <Bell color={COLORS.white} size={20} />;
        }
    };

    const handleAlertPress = async (item: Alert) => {
        // Mark as read in Firestore
        if (!item.read) {
            const currentUser = firebaseAuth.currentUser;
            if (currentUser && !item.id.startsWith('mock')) {
                db.collection('users').doc(currentUser.uid)
                    .collection('notifications').doc(item.id)
                    .update({ read: true }).catch(console.error);
            }

            // Optimistic UI update
            setAlerts(prev => prev.map(a => a.id === item.id ? { ...a, read: true } : a));
        }

        // Contextual Navigation
        switch (item.type) {
            case 'like':
            case 'comment':
                if (item.relatedId) {
                    navigation.navigate('Feed', { initialPostId: item.relatedId });
                }
                break;
            case 'follow':
                if (item.fromUser) {
                    navigation.navigate('Profile', { userId: item.fromUser.uid });
                }
                break;
            case 'reward':
                navigation.navigate('Rewards');
                break;
            case 'squad':
                if (item.relatedId) {
                    navigation.navigate('SquadDetail', { squadId: item.relatedId });
                } else {
                    navigation.navigate('SquadsTab');
                }
                break;
            default:
                if (item.fromUser) {
                    navigation.navigate('Profile', { userId: item.fromUser.uid });
                }
        }
    };

    const renderAlertItem = ({ item }: { item: Alert }) => (
        <TouchableOpacity
            style={[styles.alertItem, !item.read && styles.unreadItem]}
            onPress={() => handleAlertPress(item)}
        >
            <View style={styles.alertIcon}>
                {item.fromUser ? (
                    <Image source={{ uri: item.fromUser.avatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.iconCircle}>{getIcon(item.type)}</View>
                )}
                {!item.read && <View style={styles.unreadDot} />}
            </View>

            <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{item.title}</Text>
                <Text style={styles.alertMessage} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.alertTime}>
                    {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </Text>
            </View>

            <ChevronRight color={COLORS.textSecondary} size={16} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Activity</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={alerts}
                    keyExtractor={item => item.id}
                    renderItem={renderAlertItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Bell color={COLORS.surface} size={64} />
                            <Text style={styles.emptyText}>No activity yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.white,
    },
    list: {
        paddingVertical: 8,
    },
    alertItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    unreadItem: {
        backgroundColor: 'rgba(143, 251, 185, 0.03)',
    },
    alertIcon: {
        position: 'relative',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    unreadDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 2,
    },
    alertMessage: {
        color: COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 18,
    },
    alertTime: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        marginTop: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        marginTop: 16,
    }
});

export default AlertsScreen;
