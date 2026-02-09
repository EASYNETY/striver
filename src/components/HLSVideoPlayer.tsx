/**
 * HLS Video Player Component
 * Optimized for Cloudflare Stream HLS playback with controls
 */

import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity, Animated } from 'react-native';
import Video from 'react-native-video';
import { Play, RotateCcw } from 'lucide-react-native';

interface HLSVideoPlayerProps {
  videoUrl: string;
  thumbnail?: string;
  paused?: boolean;
  muted?: boolean;
  repeat?: boolean;
  style?: any;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onProgress?: (progress: any) => void;
  onEnd?: () => void;
}

export const HLSVideoPlayer: React.FC<HLSVideoPlayerProps> = ({
  videoUrl,
  thumbnail,
  paused = false,
  muted = false,
  repeat = false,
  style,
  onLoad,
  onError,
  onProgress,
  onEnd
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasEnded, setHasEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<Video>(null);
  const controlsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoading(true);
    setError(null);
    setHasEnded(false);
  }, [videoUrl]);

  useEffect(() => {
    if (showControls || hasEnded) {
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showControls, hasEnded]);

  const handleLoad = (data: any) => {
    setLoading(false);
    setDuration(data.duration);
    onLoad?.();
  };

  const handleError = (err: any) => {
    console.error('[HLSVideoPlayer] Error:', err);
    setLoading(false);
    setError('Failed to load video');
    onError?.(err);
  };

  const handleProgress = (data: any) => {
    setCurrentTime(data.currentTime);
    onProgress?.(data);
  };

  const handleEnd = () => {
    setHasEnded(true);
    onEnd?.();
  };

  const handleReplay = () => {
    setHasEnded(false);
    setCurrentTime(0);
    videoRef.current?.seek(0);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    // Auto-hide controls after 3 seconds
    if (!showControls) {
      setTimeout(() => setShowControls(false), 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={StyleSheet.absoluteFill} 
        activeOpacity={1}
        onPress={toggleControls}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          repeat={repeat && !hasEnded}
          paused={paused || hasEnded}
          muted={muted}
          onLoad={handleLoad}
          onError={handleError}
          onProgress={handleProgress}
          onEnd={handleEnd}
        />
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8FFBB9" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Replay Button - Shows when video ends */}
      {hasEnded && (
        <View style={styles.replayContainer}>
          <TouchableOpacity style={styles.replayButton} onPress={handleReplay}>
            <RotateCcw color="#fff" size={40} />
            <Text style={styles.replayText}>Replay</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Bar and Controls */}
      <Animated.View 
        style={[
          styles.controlsContainer, 
          { opacity: controlsOpacity }
        ]}
        pointerEvents={showControls || hasEnded ? 'auto' : 'none'}
      >
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  },
  replayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  replayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(143, 251, 185, 0.2)',
    borderRadius: 60,
    width: 120,
    height: 120,
    borderWidth: 3,
    borderColor: '#8FFBB9',
  },
  replayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8FFBB9',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default HLSVideoPlayer;
