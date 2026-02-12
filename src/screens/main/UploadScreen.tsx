import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert, Platform, PermissionsAndroid, Modal, PanResponder, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { ChevronLeft, Camera as CameraIcon, RefreshCw, Zap, Image as ImageIcon, PlayCircle } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { CameraPermissionModal } from '../../components/common/CameraPermissionModal';
import userService from '../../api/userService';
import BackgroundUploadService from '../../services/backgroundUploadService';
import { Cloud, CheckCircle } from 'lucide-react-native';

const UploadScreen = ({ navigation, route }: any) => {
    const insets = useSafeAreaInsets();
    const { squadId, responseTo } = route.params || {};
    const [title, setTitle] = useState(responseTo ? 'My Response' : '');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const [showTrimModal, setShowTrimModal] = useState(false);
    const [trimStartTime, setTrimStartTime] = useState(0);
    const [trimEndTime, setTrimEndTime] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [currentPlayTime, setCurrentPlayTime] = useState(0);
    const videoRef = React.useRef<any>(null);
    const SCREEN_WIDTH = Dimensions.get('window').width;
    const SLIDER_WIDTH = SCREEN_WIDTH - 80; // Adjusted for padding
    const MIN_TRIM_DURATION = 1; // Minimum 1 second
    const MAX_TRIM_DURATION = 60; // Maximum 60 seconds

    // Refs for gesture handling to avoid closure staleness
    const startTimeRef = React.useRef(0);
    const endTimeRef = React.useRef(0);
    const durationRef = React.useRef(0);
    const dragStartPositionRef = React.useRef({ start: 0, end: 0 });
    const lastSeekTime = React.useRef(0);
    const seekState = React.useRef({ start: 0, end: 0 }); // Add missing seekState ref

    React.useEffect(() => { startTimeRef.current = trimStartTime; }, [trimStartTime]);
    React.useEffect(() => { endTimeRef.current = trimEndTime; }, [trimEndTime]);
    React.useEffect(() => { durationRef.current = videoDuration; }, [videoDuration]);

    const throttleSeek = (time: number) => {
        const now = Date.now();
        if (now - lastSeekTime.current > 100) {
            videoRef.current?.seek(time);
            lastSeekTime.current = now;
        }
    };

    const panResponderLeft = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsDragging(true);
                dragStartPositionRef.current = {
                    start: startTimeRef.current,
                    end: endTimeRef.current
                };
            },
            onPanResponderMove: (_, gestureState) => {
                const duration = durationRef.current || 1;
                // Avoid division by zero
                const sliderWidth = SLIDER_WIDTH > 0 ? SLIDER_WIDTH : 1;

                // Move based on percentage of slider width
                const movePercent = gestureState.dx / sliderWidth;
                const deltaTime = movePercent * duration;
                const newStart = dragStartPositionRef.current.start + deltaTime;

                // Constraints: start must be >= 0 and at least MIN_TRIM_DURATION before current end
                const minStart = 0;
                const maxStart = Math.max(0, endTimeRef.current - MIN_TRIM_DURATION);

                const clamped = Math.max(minStart, Math.min(newStart, maxStart));

                if (Math.abs(clamped - startTimeRef.current) > 0.01) {
                    setTrimStartTime(clamped);
                    throttleSeek(clamped);
                }
            },
            onPanResponderRelease: () => {
                setIsDragging(false);
                videoRef.current?.seek(startTimeRef.current);
            }
        })
    ).current;

    const panResponderRight = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsDragging(true);
                dragStartPositionRef.current = {
                    start: startTimeRef.current,
                    end: endTimeRef.current
                };
            },
            onPanResponderMove: (_, gestureState) => {
                const duration = durationRef.current || 1;
                // Avoid division by zero
                const sliderWidth = SLIDER_WIDTH > 0 ? SLIDER_WIDTH : 1;

                // Move based on percentage of slider width
                const movePercent = gestureState.dx / sliderWidth;
                const deltaTime = movePercent * duration;
                const newEnd = dragStartPositionRef.current.end + deltaTime;

                // Constraints: end must be at least MIN_TRIM_DURATION after current start, max MAX_TRIM_DURATION from current start, and <= video duration
                const minEnd = Math.min(duration, startTimeRef.current + MIN_TRIM_DURATION);
                const maxEnd = Math.min(duration, startTimeRef.current + MAX_TRIM_DURATION);

                const clamped = Math.max(minEnd, Math.min(newEnd, maxEnd));

                if (Math.abs(clamped - endTimeRef.current) > 0.01) {
                    setTrimEndTime(clamped);
                    throttleSeek(clamped);
                }
            },
            onPanResponderRelease: () => {
                setIsDragging(false);
                videoRef.current?.seek(endTimeRef.current);
            }
        })
    ).current;

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "Striver Camera Permission",
                        message: "Striver needs access to your camera to record your skills.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const onVideoLoad = (data: any) => {
        if (data.duration && (!videoDuration || Math.abs(videoDuration - data.duration) > 0.5)) {
            setVideoDuration(data.duration);

            // Initialize trim values if not already set
            if (trimEndTime === 0) {
                const endTime = Math.min(data.duration, 60);
                setTrimEndTime(endTime);
                endTimeRef.current = endTime;

                // Show trim modal if video is longer than 60 seconds
                if (data.duration > 60 && !showTrimModal) {
                    setShowTrimModal(true);
                }
            }
        }
    };

    const pickVideo = async () => {
        try {
            const result = await launchImageLibrary({ mediaType: 'video', selectionLimit: 1 });
            if (result.didCancel) return;
            if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
                const asset = result.assets[0];
                const uri = asset.uri!;
                setVideoUri(uri);

                // Reset trim values
                setTrimStartTime(0);
                startTimeRef.current = 0;

                // Use asset duration if available to initialize state immediately
                if (asset.duration) {
                    const duration = asset.duration;
                    setVideoDuration(duration);

                    // Initialize trim values immediately
                    if (duration > 60) {
                        setTrimEndTime(60);
                        setShowTrimModal(true);
                        endTimeRef.current = 60;
                    } else {
                        setTrimEndTime(duration);
                        endTimeRef.current = duration;
                    }
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not pick video");
        }
    };



    const handleTrim = () => {
        const duration = trimEndTime - trimStartTime;
        console.log(`[UploadScreen] Trim applied: ${trimStartTime.toFixed(2)}s to ${trimEndTime.toFixed(2)}s (${duration.toFixed(2)}s)`);
        Alert.alert(
            "Video Trimmed",
            `Your video has been trimmed to ${Math.floor(duration)} seconds (${Math.floor(trimStartTime)}s - ${Math.floor(trimEndTime)}s).`
        );
        setShowTrimModal(false);
    };

    const recordVideo = async () => {
        // Show custom permission modal first
        setShowPermissionModal(true);
    };

    const handlePermissionAllow = async () => {
        setShowPermissionModal(false);

        // Now request actual system permission
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert("Permission Denied", "Camera access is needed to record video. You can enable it in Settings.");
            return;
        }

        try {
            const result = await launchCamera({
                mediaType: 'video',
                videoQuality: 'high',
                durationLimit: 60,
                cameraType: cameraType
            });

            if (result.didCancel) return;
            if (result.errorCode) {
                Alert.alert("Camera Error", result.errorMessage || "Could not open camera.");
                return;
            }

            if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
                setVideoUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not launch camera.");
        }
    };

    const handlePermissionDeny = () => {
        setShowPermissionModal(false);
    };

    const toggleCamera = () => {
        setCameraType(prev => prev === 'back' ? 'front' : 'back');
        Alert.alert("Camera Switched", `Now using ${cameraType === 'back' ? 'front' : 'back'} camera.`);
    };

    const handlePost = async () => {
        if (!title.trim()) {
            Alert.alert("Missing Info", "Please add a caption for your video.");
            return;
        }

        if (!videoUri) {
            Alert.alert("No Video Selected", "Please select or record a video first.");
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            console.log('[UploadScreen] Starting Cloudflare upload with videoUri:', videoUri);

            // Get challenge info from route params
            const { challengeId, challengePostId } = route.params || {};

            // Queue the upload in the background service
            await BackgroundUploadService.queueUpload(
                videoUri,
                title,
                tags.split(',').map(tag => tag.trim()).filter(t => t.length > 0),
                squadId || challengeId,
                trimStartTime,
                trimEndTime,
                videoDuration,
                responseTo || challengePostId
            );

            console.log('[UploadScreen] Video queued for background upload');

            // Show customized success modal instead of generic Alert
            setShowSuccessModal(true);

        } catch (error: any) {
            console.error('[UploadScreen] Error queueing upload:', error);
            Alert.alert(
                "Upload Failed",
                "Failed to start upload. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.cameraContainer}>
                {/* Video Preview / Camera Placeholder */}
                <View style={styles.cameraPlaceholder}>
                    {videoUri ? (
                        <Video
                            ref={videoRef}
                            source={{ uri: videoUri }}
                            style={StyleSheet.absoluteFill}
                            resizeMode="cover"
                            repeat={true}
                            muted={true}
                            paused={isDragging} // Pause while scrubbing/trimming
                            onLoad={onVideoLoad}
                        />
                    ) : (
                        <>
                            <Text style={styles.cameraText}>CAMERA FEED</Text>
                            <View style={styles.timer}>
                                <Text style={styles.timerText}>0:60</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* View Overlay Controls */}
                <View style={[styles.topControls, { top: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <ChevronLeft color={COLORS.white} size={28} />
                    </TouchableOpacity>
                    <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '800' }}>
                        {responseTo ? 'Post Response' : 'New Video'}
                    </Text>
                    <View style={styles.rightControls}>
                        <TouchableOpacity onPress={toggleCamera}>
                            <RefreshCw color={COLORS.white} size={28} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Alert.alert("Flash", "Flash toggled")}>
                            <Zap color={COLORS.white} size={28} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Alert.alert("Beauty", "Beauty filters enabled")}>
                            <CameraIcon color={COLORS.white} size={28} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Botton Controls */}
                <View style={styles.bottomControls}>
                    <TouchableOpacity style={styles.galleryBtn} onPress={pickVideo}>
                        <ImageIcon color={COLORS.white} size={32} />
                        <Text style={styles.galleryText}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.recordOuter}
                        onPress={recordVideo}
                    >
                        <View style={styles.recordInner} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.effectsBtn} onPress={() => videoUri && Alert.alert("Preview", "Previewing video...")}>
                        <PlayCircle color={COLORS.white} size={32} />
                        <Text style={styles.galleryText}>Preview</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <ScrollView>
                    <View style={styles.form}>
                        <Text style={styles.label}>Video Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="What's this about?"
                            placeholderTextColor={COLORS.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.label}>Tags</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="#skill, #goal, #challenge"
                            placeholderTextColor={COLORS.textSecondary}
                            value={tags}
                            onChangeText={setTags}
                        />

                        <TouchableOpacity
                            style={[styles.postBtn, loading && { opacity: 0.7 }]}
                            onPress={handlePost}
                            disabled={loading}
                        >
                            <Text style={styles.postBtnText}>
                                {loading ? `Uploading... ${uploadProgress}%` : 'Post to Striver'}
                            </Text>
                        </TouchableOpacity>

                        {loading && uploadProgress > 0 && (
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>

            {/* Custom Permission Modal */}
            <CameraPermissionModal
                visible={showPermissionModal}
                onAllow={handlePermissionAllow}
                onDeny={handlePermissionDeny}
            />

            {/* Branded Success Modal */}
            <Modal visible={showSuccessModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.successModal}>
                        <View style={styles.successIconContainer}>
                            <Cloud color={COLORS.primary} size={48} />
                            <View style={styles.successBadge}>
                                <CheckCircle color={COLORS.background} size={20} fill={COLORS.primary} />
                            </View>
                        </View>

                        <Text style={styles.successTitle}>Upload Started!</Text>
                        <Text style={styles.successText}>
                            We're processing your video in the background. You can keep using Striver normally.
                        </Text>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                🔔 We'll notify you as soon as your video is live on the feed!
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.successBtn}
                            onPress={() => {
                                setShowSuccessModal(false);
                                navigation.navigate('HomeFeed');
                            }}
                        >
                            <Text style={styles.successBtnText}>GOT IT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Trim Modal */}
            <Modal visible={showTrimModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.trimModal}>
                        <Text style={styles.trimTitle}>Video Too Long</Text>
                        <Text style={styles.trimText}>
                            Striver videos must be 60 seconds or less. Choose which part to keep.
                        </Text>

                        <View style={styles.trimControls}>
                            <Text style={styles.trimLabel}>
                                {Math.floor(trimStartTime)}s - {Math.floor(trimEndTime)}s ({Math.floor(trimEndTime - trimStartTime)}s)
                            </Text>
                            <View style={[styles.sliderContainer, { width: SLIDER_WIDTH }]}>
                                {/* Track Background */}
                                <View style={styles.sliderTrack}>
                                    <View style={[styles.sliderSelected, {
                                        left: `${(trimStartTime / (videoDuration || 1)) * 100}%`,
                                        width: `${((trimEndTime - trimStartTime) / (videoDuration || 1)) * 100}%`
                                    }]} />
                                </View>

                                {/* Left Thumb */}
                                <View
                                    style={[styles.sliderThumb, { left: `${(trimStartTime / (videoDuration || 1)) * 100}%` }]}
                                    {...panResponderLeft.panHandlers}
                                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                                >
                                    <View style={styles.thumbInner} />
                                </View>

                                {/* Right Thumb */}
                                <View
                                    style={[styles.sliderThumb, { left: `${(trimEndTime / (videoDuration || 1)) * 100}%` }]}
                                    {...panResponderRight.panHandlers}
                                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                                >
                                    <View style={styles.thumbInner} />
                                </View>
                            </View>
                            <Text style={styles.trimSubtext}>Drag handles to trim (max 60s)</Text>
                        </View>

                        <View style={styles.trimActions}>
                            <TouchableOpacity
                                style={[styles.trimBtn, { backgroundColor: COLORS.primary }]}
                                onPress={handleTrim}
                            >
                                <Text style={styles.trimBtnText}>Trim Selection</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.trimBtn, styles.discardBtn]}
                                onPress={() => { setVideoUri(null); setShowTrimModal(false); }}
                            >
                                <Text style={[styles.trimBtnText, { color: COLORS.white }]}>Discard</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    cameraContainer: {
        height: '60%',
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    cameraPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraText: {
        color: 'rgba(255,255,255,0.1)',
        fontSize: 24,
        fontWeight: '800',
    },
    timer: {
        position: 'absolute',
        top: 60,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    timerText: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: '700',
    },
    topControls: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightControls: {
        gap: 20,
    },
    bottomControls: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    recordOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FF3B30',
    },
    galleryBtn: {
        alignItems: 'center',
        gap: 4,
    },
    galleryPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    galleryText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: '600',
    },
    effectsBtn: {
        alignItems: 'center',
        gap: 4,
    },
    detailsContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
        padding: SPACING.lg,
    },
    form: {
        gap: 12,
    },
    label: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 12,
        color: COLORS.white,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    postBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    postBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.background,
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: 'rgba(143, 251, 185, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    trimModal: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    trimTitle: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
    },
    trimText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    trimActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    trimBtn: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    discardBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.white,
    },
    trimBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.background,
    },
    trimControls: {
        width: '100%',
        marginBottom: 24,
        alignItems: 'center',
    },
    trimLabel: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    sliderContainer: {
        width: 250,
        height: 40,
        justifyContent: 'center',
    },
    sliderTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        position: 'relative',
    },
    sliderProgress: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    sliderThumb: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 5, // Center in 40px container (40-30)/2
        marginLeft: -15, // Center the thumb
        zIndex: 10,
    },
    thumbInner: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    sliderSelected: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    trimSubtext: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 8,
    },
    // Success Modal Styles
    successModal: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 32,
        width: '85%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(168, 246, 189, 0.2)', // Striver Green glow
        elevation: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    successIconContainer: {
        marginBottom: 24,
        position: 'relative',
    },
    successBadge: {
        position: 'absolute',
        bottom: -5,
        right: -10,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 2,
    },
    successTitle: {
        color: COLORS.white,
        fontSize: 24,
        fontFamily: FONTS.display.bold,
        marginBottom: 12,
        textAlign: 'center',
    },
    successText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
        fontFamily: FONTS.body.regular,
    },
    infoBox: {
        backgroundColor: 'rgba(168, 246, 189, 0.05)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
        width: '100%',
    },
    infoText: {
        color: COLORS.primary,
        fontSize: 14,
        textAlign: 'center',
        fontFamily: FONTS.body.medium,
    },
    successBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        width: '100%',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    successBtnText: {
        color: COLORS.background,
        fontSize: 16,
        fontFamily: FONTS.display.bold,
        letterSpacing: 1,
    }
});

export default UploadScreen;
