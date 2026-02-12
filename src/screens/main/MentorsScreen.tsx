import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { ChevronLeft, MessageCircle, UserCheck, CheckCircle, Clock, AlertTriangle, ShieldCheck, Plus, X } from 'lucide-react-native';
import { db, firebaseAuth } from '../../api/firebase';
import mentorWaitlistService from '../../api/mentorWaitlistService';

interface Mentor {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    bio?: string;
    specialties?: string[];
    verified?: boolean;
}

const MentorsScreen = ({ navigation }: any) => {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);

    // WAITLIST STATE
    const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected' | 'revoked' | 'success'>('none');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);
    const [isUserMentor, setIsUserMentor] = useState(false);

    useEffect(() => {
        loadMentors();
        checkWaitlistStatus();
    }, []);

    const checkWaitlistStatus = async () => {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
            const isMentor = await mentorWaitlistService.isMentor(currentUser.uid);
            setIsUserMentor(isMentor);

            const req = await mentorWaitlistService.getUserRequest(currentUser.uid);
            if (req) {
                setRequestStatus(req.status as any);
            } else {
                setRequestStatus('none');
            }
        }
    };

    const handleJoinWaitlist = async () => {
        setRequestLoading(true);
        try {
            const result = await mentorWaitlistService.submitRequest();
            if (result.success) {
                setRequestStatus('success');
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to submit application.');
        } finally {
            setRequestLoading(false);
        }
    };

    const handleRevokeRequest = async () => {
        Alert.alert(
            'Revoke Application',
            'Are you sure you want to revoke your mentor application? You will need to re-apply.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Revoke',
                    style: 'destructive',
                    onPress: async () => {
                        setRequestLoading(true);
                        const currentUser = firebaseAuth.currentUser;
                        if (currentUser) {
                            const result = await mentorWaitlistService.cancelUserRequest(currentUser.uid);
                            if (result.success) {
                                setRequestStatus('none');
                                Alert.alert('Success', 'Application revoked.');
                                setShowRequestModal(false);
                            } else {
                                Alert.alert('Error', result.message);
                            }
                        }
                        setRequestLoading(false);
                    }
                }
            ]
        );
    };

    const loadMentors = async () => {
        try {
            const snapshot = await db.collection('users')
                .where('isMentor', '==', true)
                .get();

            const mentorsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Mentor[];

            setMentors(mentorsList);
        } catch (error) {
            console.error('[Mentors] Failed to load:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContactMentor = (mentor: Mentor) => {
        // Navigate to chat or profile
        navigation.navigate('Profile', { userId: mentor.id });
    };

    const renderMentor = ({ item }: { item: Mentor }) => (
        <TouchableOpacity
            style={styles.mentorCard}
            onPress={() => handleContactMentor(item)}
            activeOpacity={0.7}
        >
            <View style={styles.mentorHeader}>
                <Image
                    source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${item.displayName}&background=A8F6BD&color=0A1128` }}
                    style={styles.avatar}
                />
                <View style={styles.mentorInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.mentorName}>{item.displayName || item.username}</Text>
                        {item.verified && (
                            <UserCheck size={16} color={COLORS.primary} fill={COLORS.primary} />
                        )}
                    </View>
                    <Text style={styles.mentorUsername}>@{item.username}</Text>
                </View>
            </View>

            {item.bio && (
                <Text style={styles.mentorBio} numberOfLines={2}>
                    {item.bio}
                </Text>
            )}

            {item.specialties && item.specialties.length > 0 && (
                <View style={styles.specialtiesContainer}>
                    {item.specialties.slice(0, 3).map((specialty, index) => (
                        <View key={index} style={styles.specialtyTag}>
                            <Text style={styles.specialtyText}>{specialty}</Text>
                        </View>
                    ))}
                </View>
            )}

            <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleContactMentor(item)}
            >
                <MessageCircle size={18} color={COLORS.background} />
                <Text style={styles.contactButtonText}>Connect</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <ChevronLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>MENTORS & COACHES</Text>
                {!isUserMentor ? (
                    <TouchableOpacity
                        style={styles.createBtn}
                        onPress={() => setShowRequestModal(true)}
                    >
                        <Plus color={COLORS.background} size={18} />
                        <Text style={styles.createBtnText}>APPLY</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading mentors...</Text>
                </View>
            ) : mentors.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No mentors available yet</Text>
                    <Text style={styles.emptySubtext}>Be the first to join the roster!</Text>
                </View>
            ) : (
                <FlatList
                    data={mentors}
                    renderItem={renderMentor}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Dynamic Request Status Modal */}
            <Modal
                visible={showRequestModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRequestModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setShowRequestModal(false)}
                        >
                            <X color={COLORS.textSecondary} size={24} />
                        </TouchableOpacity>

                        {/* SUCCESS STATE */}
                        {requestStatus === 'success' && (
                            <>
                                <View style={[styles.modalIconContainer, { borderColor: COLORS.primary, backgroundColor: 'rgba(168, 246, 189, 0.1)' }]}>
                                    <CheckCircle color={COLORS.primary} size={40} />
                                </View>
                                <Text style={styles.modalTitle}>APPLICATION RECEIVED</Text>
                                <Text style={styles.modalDescription}>
                                    We have received your request. We will review your profile and notify you once approved.
                                </Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowRequestModal(false)}>
                                        <Text style={styles.primaryBtnText}>GOT IT</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* PENDING STATE */}
                        {requestStatus === 'pending' && (
                            <>
                                <View style={[styles.modalIconContainer, { borderColor: '#FF9500', backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
                                    <Clock color="#FF9500" size={40} />
                                </View>
                                <Text style={styles.modalTitle}>PENDING REVIEW</Text>
                                <Text style={styles.modalDescription}>
                                    Your application is currently being reviewed by our team. This generally takes 24-48 hours.
                                </Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowRequestModal(false)}>
                                        <Text style={styles.primaryBtnText}>CLOSE</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.shareBtn, { borderColor: '#FF453A' }]} onPress={handleRevokeRequest}>
                                        <Text style={[styles.shareBtnText, { color: '#FF453A' }]}>CANCEL APPLICATION</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* APPROVED STATE */}
                        {requestStatus === 'approved' && (
                            <>
                                <View style={[styles.modalIconContainer, { borderColor: COLORS.primary, backgroundColor: 'rgba(168, 246, 189, 0.1)' }]}>
                                    <ShieldCheck color={COLORS.primary} size={40} />
                                </View>
                                <Text style={styles.modalTitle}>YOU'RE A MENTOR!</Text>
                                <Text style={styles.modalDescription}>
                                    Congratulations! You are now a verified Striver Mentor.
                                </Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowRequestModal(false)}>
                                        <Text style={styles.primaryBtnText}>CLOSE</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* REJECTED STATE */}
                        {requestStatus === 'rejected' && (
                            <>
                                <View style={[styles.modalIconContainer, { borderColor: '#FF453A', backgroundColor: 'rgba(255, 69, 58, 0.1)' }]}>
                                    <AlertTriangle color="#FF453A" size={40} />
                                </View>
                                <Text style={styles.modalTitle}>APPLICATION UPDATE</Text>
                                <Text style={styles.modalDescription}>
                                    Unfortunately, your application was not approved at this time. Keep striving!
                                </Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowRequestModal(false)}>
                                        <Text style={styles.primaryBtnText}>CLOSE</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* INITIAL / NONE / REVOKED STATE */}
                        {(requestStatus === 'none' || requestStatus === 'revoked') && (
                            <>
                                <View style={styles.modalIconContainer}>
                                    <ShieldCheck color={COLORS.primary} size={40} />
                                </View>
                                <Text style={styles.modalTitle}>BECOME A MENTOR</Text>
                                <Text style={styles.modalDescription}>
                                    Share your expertise and guide the next generation of ballers. Apply to become a verified mentor.
                                </Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={handleJoinWaitlist} disabled={requestLoading}>
                                        {requestLoading ? (
                                            <ActivityIndicator color={COLORS.background} />
                                        ) : (
                                            <Text style={styles.primaryBtnText}>APPLY NOW</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: FONTS.display.bold,
        color: COLORS.text,
        letterSpacing: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: FONTS.display.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    listContent: {
        padding: SPACING.md,
        gap: SPACING.md,
    },
    mentorCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: SPACING.sm,
    },
    mentorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: SPACING.md,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    mentorInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    mentorName: {
        fontSize: 18,
        fontFamily: FONTS.display.bold,
        color: COLORS.text,
        textTransform: 'uppercase',
    },
    mentorUsername: {
        fontSize: 12,
        fontFamily: FONTS.body.medium,
        color: COLORS.textSecondary,
    },
    mentorBio: {
        fontSize: 14,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        lineHeight: 22,
    },
    specialtiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: SPACING.md,
    },
    specialtyTag: {
        backgroundColor: 'rgba(168, 246, 189, 0.05)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(168, 246, 189, 0.2)',
    },
    specialtyText: {
        fontSize: 10,
        fontFamily: FONTS.display.medium,
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
    },
    contactButtonText: {
        fontSize: 14,
        fontFamily: FONTS.display.bold,
        color: COLORS.background,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // NEW STYLES
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(168, 246, 189, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        gap: 6
    },
    createBtnText: {
        fontSize: 12,
        fontFamily: FONTS.display.bold,
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 8, 17, 0.9)', // Deep blur equivalent
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#0F1529', // Slightly lighter than background
        borderRadius: 32,
        padding: SPACING.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        position: 'relative',
    },
    closeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(168, 246, 189, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(168, 246, 189, 0.2)',
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: FONTS.display.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modalDescription: {
        fontSize: 14,
        fontFamily: FONTS.body.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 22,
    },
    modalActions: {
        width: '100%',
        gap: 12,
    },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: {
        fontSize: 16,
        fontFamily: FONTS.display.bold,
        color: COLORS.background,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    shareBtn: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'transparent',
    },
    shareBtnText: {
        fontSize: 14,
        fontFamily: FONTS.display.medium,
        color: COLORS.text,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default MentorsScreen;
