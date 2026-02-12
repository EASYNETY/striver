import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { Bell, Heart, MessageSquare, UserPlus, Trophy, ChevronRight, Star, AlertTriangle, Video, Shield, CheckCircle } from 'lucide-react-native';
import { firebaseAuth, db } from '../../api/firebase';
import { DiagonalStreaksBackground } from '../../components/common/DiagonalStreaksBackground';

interface Alert {
    id: string;
    type: 'like' | 'comment' | 'reply' | 'follow' | 'reward' | 'squad' | 'upload' | 'admin_warning' | 'squad_approved' | 'squad_rejected' | 'moderation' | 'verification';
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
    priority?: 'low' | 'normal' | 'high';
}

const AlertsScreen = ({ navigation }: any) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = () => {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const unsubscribe = db.collection('users').doc(currentUser.uid).collection('notifications')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .onSnapshot(
                snapshot => {
                    const fetchedAlerts: Alert[] = [];
                    snapshot.forEach(doc => {
                        fetchedAlerts.push({ id: doc.id, ...doc.data() } as Alert);
                    });
                    setAlerts(fetchedAlerts);
                    setLoading(false);
                    setRefreshing(false);
                },
                error => {
                    console.error('[Alerts] Error loading notifications:', error);
                    setLoading(false);
                    setRefreshing(false);
                }
            );

        return () => unsubscribe();
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const getIcon = (type: string, priority?: string) => {
        const isHighPriority = priority === 'high';
        const color = isHighPriority ? '#FF4B4B' : COLORS.primary;

        switch (type) {
            case 'like': 
                return <Heart color="#FF4B4B" size={20} fill="#FF4B4B" />;
            case 'comment': 
            case 'reply':
                return <MessageSquare color={COLORS.primary} size={20} />;
            case 'follow': 
                return <UserPlus color="#4B7BFF" size={20} />;
            case 'reward': 
                return <Star color="#FFD700" size={20} fill="#FFD700" />;
            case 'squad': 
                return <Trophy color={COLORS.primary} size={20} />;
            case 'upload':
                return <Video color={COLORS.primary} size={20} />;
            case 'admin_warning':
                return <AlertTriangle color="#FF4B4B" size={20} />;
            case 'squad_approved':
                return <CheckCircle color={COLORS.primary} size={20} />;
            case 'squad_rejected':
                return <AlertTriangle color="#FF9500" size={20} />;
            case 'moderation':
                return <Shield color="#FF9500" size={20} />;
            case 'verification':
                return <CheckCircle color={COLORS.primary} size={20} />;
            default: 
                return <Bell color={color} size={20} />;
        }
    };

    const handleAlertPress = async (item: Alert) => {
        // Mark as read in Firestore
        if (!item.read) {
            const currentUser = firebaseAuth.currentUser;
            if (currentUser) {
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
            case 'reply':
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
            case 'squad_approved':
            case 'squad_rejected':
                if (item.relatedId) {
                    navigation.navigate('SquadDetail', { squadId: item.relatedId });
                } else {
                    navigation.navigate('SquadsTab');
                }
                break;
            case 'upload':
                if (item.relatedId) {
                    navigation.navigate('Feed', { initialPostId: item.relatedId });
                } else {
                    navigation.navigate('HomeFeed');
                }
                break;
            case 'admin_warning':
            case 'moderation':
                // Stay on alerts screen or navigate to settings
                break;
            case 'verification':
                navigation.navigate('Settings');
                break;
            default:
                if (item.fromUser) {
                    navigation.navigate('Profile', { userId: item.fromUser.uid });
                }
        }
    };

    const markAllAsRead = async () => {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return;

        const batch = db.batch();
        const unreadAlerts = alerts.filter(a => !a.read);

        unreadAlerts.forEach(alert => {
            const ref = db.collection('users').doc(currentUser.uid)
                .collection('notifications').doc(alert.id);
            batch.update(ref, { read: true });
        });

        try {
            await batch.commit();
            setAlerts(prev => prev.map(a => ({ ...a, read: true })));
        } catch (error) {
            console.error('[Alerts] Failed to mark all as read:', error);
        }
    };

    const renderAlertItem = ({ item }: { item: Alert }) => {
        const isHighPriority = item.priority === 'high';
        
        return (
            <TouchableOpacity
                style={[
                    styles.alertItem,
                    !item.read && styles.unreadItem,
                    isHighPriority && styles.highPriorityItem
                ]}
                onPress={() => handleAlertPress(item)}
            >
                <View style={styles.alertIcon}>
                    {item.fromUser ? (
                        <Image 
                            source={{ uri: item.fromUser.avatar || `https://ui-avatars.com/api/?name=${item.fromUser.username}&background=8FFBB9&color=050811` }} 
                            style={styles.avatar} 
                        />
                    ) : (
                        <View style={[
                            styles.iconCircle,
                            isHighPriority && styles.highPriorityIcon
                        ]}>
                            {getIcon(item.type, item.priority)}
                        </View>
                    )}
                    {!item.read && <View style={styles.unreadDot} />}
                </View>

                <View style={styles.alertContent}>
                    <Text style={[
                        styles.alertTitle,
                        isHighPriority && styles.highPriorityText
                    ]}>
                        {item.title}
                    </Text>
                    <Text style={styles.alertMessage} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={styles.alertTime}>
                        {item.timestamp?.toDate ? formatTimestamp(item.timestamp.toDate()) : 'Just now'}
                    </Text>
                </View>

                <ChevronRight color={COLORS.textSecondary} size={16} />
            </TouchableOpacity>
        );
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const unreadCount = alerts.filter(a => !a.read).length;

    return (
        <SafeAreaView style={styles.container}>
            <DiagonalStreaksBackground />
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Activity</Text>
                    {unreadCount > 0 && (
                        <Text style={styles.unreadCount}>{unreadCount} unread</Text>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
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
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Bell color={COLORS.surface} size={64} />
                            <Text style={styles.emptyText}>No notifications yet</Text>
                            <Text style={styles.emptySubtext}>
                                You'll see likes, comments, and updates here
                            </Text>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.white,
    },
    unreadCount: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    markAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(143, 251, 185, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(143, 251, 185, 0.2)',
    },
    markAllText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    list: {
        paddingVertical: 8,
    },
    alertItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.02)',
    },
    unreadItem: {
        backgroundColor: 'rgba(143, 251, 185, 0.03)',
    },
    highPriorityItem: {
        backgroundColor: 'rgba(255, 75, 75, 0.05)',
        borderLeftWidth: 3,
        borderLeftColor: '#FF4B4B',
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
    highPriorityIcon: {
        backgroundColor: 'rgba(255, 75, 75, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 75, 75, 0.2)',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(143, 251, 185, 0.2)',
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
    highPriorityText: {
        color: '#FF4B4B',
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
        paddingHorizontal: SPACING.xl,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    }
});

export default AlertsScreen;
