import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';
import { Scissors } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 80;
const THUMB_SIZE = 32;
const MIN_DURATION = 1; // 1 second minimum
const MAX_DURATION = 60; // 60 seconds maximum

interface VideoTrimmerProps {
    videoDuration: number;
    onTrimChange: (start: number, end: number) => void;
    onSeek?: (time: number) => void;
    initialStart?: number;
    initialEnd?: number;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
    videoDuration,
    onTrimChange,
    onSeek,
    initialStart = 0,
    initialEnd = 0
}) => {
    const [trimStart, setTrimStart] = useState(initialStart);
    const [trimEnd, setTrimEnd] = useState(initialEnd || Math.min(videoDuration, MAX_DURATION));
    const [isDragging, setIsDragging] = useState(false);
    
    const trimStartRef = useRef(trimStart);
    const trimEndRef = useRef(trimEnd);
    const durationRef = useRef(videoDuration);
    const seekState = useRef({ start: 0, end: 0 });
    const lastSeekTime = useRef(0);

    // Update refs when state changes
    useEffect(() => { trimStartRef.current = trimStart; }, [trimStart]);
    useEffect(() => { trimEndRef.current = trimEnd; }, [trimEnd]);
    useEffect(() => { durationRef.current = videoDuration; }, [videoDuration]);

    // Notify parent of trim changes
    useEffect(() => {
        onTrimChange(trimStart, trimEnd);
    }, [trimStart, trimEnd, onTrimChange]);

    // Throttled seek to prevent performance issues
    const throttleSeek = (time: number) => {
        const now = Date.now();
        if (onSeek && now - lastSeekTime.current > 100) {
            onSeek(time);
            lastSeekTime.current = now;
        }
    };

    // Convert pixel position to time
    const pixelToTime = (pixels: number): number => {
        return (pixels / SLIDER_WIDTH) * durationRef.current;
    };

    // Convert time to pixel position
    const timeToPixel = (time: number): number => {
        return (time / durationRef.current) * SLIDER_WIDTH;
    };

    // Left thumb pan responder (start time)
    const panResponderLeft = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsDragging(true);
                seekState.current.start = trimStartRef.current;
                seekState.current.end = trimEndRef.current;
            },
            onPanResponderMove: (_, gestureState) => {
                const duration = durationRef.current;
                const deltaTime = pixelToTime(gestureState.dx);
                let newStart = seekState.current.start + deltaTime;

                // Apply constraints
                const minStart = 0;
                const maxStart = Math.min(
                    seekState.current.end - MIN_DURATION,
                    duration - MIN_DURATION
                );

                newStart = Math.max(minStart, Math.min(newStart, maxStart));

                // Ensure total duration doesn't exceed MAX_DURATION
                if (seekState.current.end - newStart > MAX_DURATION) {
                    newStart = seekState.current.end - MAX_DURATION;
                }

                setTrimStart(newStart);
                throttleSeek(newStart);
            },
            onPanResponderRelease: () => {
                setIsDragging(false);
                if (onSeek) {
                    onSeek(trimStartRef.current);
                }
            }
        })
    ).current;

    // Right thumb pan responder (end time)
    const panResponderRight = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsDragging(true);
                seekState.current.start = trimStartRef.current;
                seekState.current.end = trimEndRef.current;
            },
            onPanResponderMove: (_, gestureState) => {
                const duration = durationRef.current;
                const deltaTime = pixelToTime(gestureState.dx);
                let newEnd = seekState.current.end + deltaTime;

                // Apply constraints
                const minEnd = seekState.current.start + MIN_DURATION;
                const maxEnd = duration;

                newEnd = Math.max(minEnd, Math.min(newEnd, maxEnd));

                // Ensure total duration doesn't exceed MAX_DURATION
                if (newEnd - seekState.current.start > MAX_DURATION) {
                    newEnd = seekState.current.start + MAX_DURATION;
                }

                setTrimEnd(newEnd);
                throttleSeek(newEnd);
            },
            onPanResponderRelease: () => {
                setIsDragging(false);
                if (onSeek) {
                    onSeek(trimEndRef.current);
                }
            }
        })
    ).current;

    const trimDuration = trimEnd - trimStart;
    const startPercent = (trimStart / videoDuration) * 100;
    const widthPercent = ((trimEnd - trimStart) / videoDuration) * 100;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Scissors color={COLORS.primary} size={20} />
                <Text style={styles.title}>Trim Video</Text>
            </View>
            
            <Text style={styles.timeLabel}>
                {formatTime(trimStart)} - {formatTime(trimEnd)} ({formatTime(trimDuration)})
            </Text>

            <View style={[styles.sliderContainer, { width: SLIDER_WIDTH }]}>
                {/* Background track */}
                <View style={styles.track}>
                    {/* Selected region */}
                    <View 
                        style={[
                            styles.selectedTrack,
                            {
                                left: `${startPercent}%`,
                                width: `${widthPercent}%`
                            }
                        ]}
                    />
                </View>

                {/* Left thumb */}
                <View
                    style={[
                        styles.thumb,
                        styles.leftThumb,
                        { left: `${startPercent}%` }
                    ]}
                    {...panResponderLeft.panHandlers}
                >
                    <View style={styles.thumbHandle}>
                        <View style={styles.thumbLine} />
                        <View style={styles.thumbLine} />
                    </View>
                </View>

                {/* Right thumb */}
                <View
                    style={[
                        styles.thumb,
                        styles.rightThumb,
                        { left: `${(trimEnd / videoDuration) * 100}%` }
                    ]}
                    {...panResponderRight.panHandlers}
                >
                    <View style={styles.thumbHandle}>
                        <View style={styles.thumbLine} />
                        <View style={styles.thumbLine} />
                    </View>
                </View>
            </View>

            <Text style={styles.hint}>
                Drag handles to select up to 60 seconds
            </Text>

            {trimDuration > MAX_DURATION && (
                <Text style={styles.warning}>
                    ⚠️ Selection must be {MAX_DURATION} seconds or less
                </Text>
            )}
        </View>
    );
};

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        justifyContent: 'center',
    },
    title: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    timeLabel: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
    },
    sliderContainer: {
        height: 50,
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 12,
    },
    track: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        position: 'relative',
    },
    selectedTrack: {
        position: 'absolute',
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    thumb: {
        position: 'absolute',
        width: THUMB_SIZE,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        top: -19, // Center vertically (44-6)/2
        zIndex: 10,
    },
    leftThumb: {
        marginLeft: -THUMB_SIZE / 2,
    },
    rightThumb: {
        marginLeft: -THUMB_SIZE / 2,
    },
    thumbHandle: {
        width: THUMB_SIZE,
        height: 44,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    thumbLine: {
        width: 2,
        height: 16,
        backgroundColor: COLORS.primary,
        borderRadius: 1,
    },
    hint: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
    },
    warning: {
        color: '#FF3B30',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '600',
    },
});
