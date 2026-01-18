import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert, Platform, PermissionsAndroid } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { COLORS, SPACING } from '../../constants/theme';
import { ChevronLeft, Camera as CameraIcon, RefreshCw, Zap, Image as ImageIcon, PlayCircle } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

import postService from '../../api/postService';
// ... rest of imports ...
import rewardService from '../../api/rewardService';
import userService from '../../api/userService';

const UploadScreen = ({ navigation, route }: any) => {
    const insets = useSafeAreaInsets();
    const { squadId } = route.params || {};
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [cameraType, setCameraType] = useState<'back' | 'front'>('back');

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

    const pickVideo = async () => {
        try {
            const result = await launchImageLibrary({ mediaType: 'video', selectionLimit: 1 });
            if (result.didCancel) return;
            if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
                setVideoUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not pick video");
        }
    };

    const recordVideo = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert("Permission Required", "Camera access is needed to record video.");
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

    const toggleCamera = () => {
        setCameraType(prev => prev === 'back' ? 'front' : 'back');
        Alert.alert("Camera Switched", `Now using ${cameraType === 'back' ? 'front' : 'back'} camera.`);
    };

    const handlePost = async () => {
        if (!title.trim()) {
            Alert.alert("Missing Info", "Please add a caption for your video.");
            return;
        }

        setLoading(true);
        try {
            if (!videoUri) {
                Alert.alert("Selection Required", "Please select a video from the gallery.");
                setLoading(false);
                return;
            }

            await postService.createPost({
                videoUri: videoUri,
                caption: title,
                hashtags: tags.split(',').map(tag => tag.trim()).filter(t => t.length > 0),
                squadId: squadId
            });

            await rewardService.updateTaskProgress('post_response', 1);

            const userData = await userService.getCurrentUserProfile();
            const isJunior = userData?.ageTier === 'junior_baller';

            Alert.alert(
                isJunior ? "Review Required" : "Success",
                isJunior
                    ? "Great video! It has been sent to your parent for approval before it goes live on the feed."
                    : "Your video has been posted!",
                [{ text: "Great!", onPress: () => navigation.navigate('HomeFeed') }]
            );
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to upload video. Please try again.");
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
                            source={{ uri: videoUri }}
                            style={StyleSheet.absoluteFill}
                            resizeMode="cover"
                            repeat={true}
                            muted={true}
                        />
                    ) : (
                        <>
                            <Text style={styles.cameraText}>CAMERA FEED</Text>
                            <View style={styles.timer}>
                                <Text style={styles.timerText}>0:45</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* View Overlay Controls */}
                <View style={[styles.topControls, { top: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <ChevronLeft color={COLORS.white} size={28} />
                    </TouchableOpacity>
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
                        <View style={[styles.recordInner, isRecording && { borderRadius: 8, width: 30, height: 30 }]} />
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

                        <Text style={styles.label}>Tags (comma separated)</Text>
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
                            <Text style={styles.postBtnText}>{loading ? 'Posting...' : 'Post to Striver'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
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
});

export default UploadScreen;
