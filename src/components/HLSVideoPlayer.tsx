/**
 * HLS Video Player Component
 * Optimized for Cloudflare Stream HLS playback
 */

import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import Video from 'react-native-video';

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
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [videoUrl]);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = (err: any) => {
    console.error('[HLSVideoPlayer] Error:', err);
    setLoading(false);
    setError('Failed to load video');
    onError?.(err);
  };

  const handleBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
    if (isBuffering) {
      console.log('[HLSVideoPlayer] Buffering...');
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat={repeat}
        paused={paused}
        muted={muted}
        onLoad={handleLoad}
        onError={handleError}
        onProgress={onProgress}
        onEnd={onEnd}
        onBuffer={handleBuffer}
      />

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
});

export default HLSVideoPlayer;
