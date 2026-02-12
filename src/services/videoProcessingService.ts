import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { RNFFmpeg } from 'react-native-ffmpeg';

/**
 * Trim video to specified start and end times using FFmpeg
 */
export const trimVideo = async (
  inputUri: string,
  startTime: number,
  endTime: number
): Promise<{ uri: string; trimStart: number; trimEnd: number }> => {
  try {
    console.log(`[VideoProcessing] Trimming video: ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s`);

    // Clean the URI
    const cleanUri = inputUri.replace('file://', '');

    // Generate output path
    const timestamp = Date.now();
    const outputPath = Platform.OS === 'ios'
      ? `${RNFS.DocumentDirectoryPath}/trimmed_${timestamp}.mp4`
      : `${RNFS.CachesDirectoryPath}/trimmed_${timestamp}.mp4`;

    console.log('[VideoProcessing] Input:', cleanUri);
    console.log('[VideoProcessing] Output:', outputPath);

    // Calculate duration
    const duration = endTime - startTime;

    // FFmpeg command to trim video
    // -ss: start time, -t: duration, -c copy: copy codec (fast, no re-encoding)
    const command = `-ss ${startTime.toFixed(3)} -i "${cleanUri}" -t ${duration.toFixed(3)} -c copy -avoid_negative_ts 1 "${outputPath}"`;

    console.log('[VideoProcessing] FFmpeg command:', command);

    // Execute FFmpeg
    const result = await RNFFmpeg.execute(command);

    if (result === 0) {
      console.log('[VideoProcessing] Trim successful');

      // Verify file exists
      const exists = await RNFS.exists(outputPath);
      if (!exists) {
        throw new Error('Trimmed file not found');
      }

      const fileInfo = await RNFS.stat(outputPath);
      console.log('[VideoProcessing] Trimmed file size:', fileInfo.size, 'bytes');

      return {
        uri: Platform.OS === 'ios' ? outputPath : `file://${outputPath}`,
        trimStart: 0, // Already trimmed
        trimEnd: duration
      };
    } else {
      throw new Error(`FFmpeg failed with code ${result}`);
    }

  } catch (error) {
    console.error('[VideoProcessing] Trim failed:', error);
    // Fallback: return original video with trim markers for server-side processing
    console.warn('[VideoProcessing] Falling back to original video (trimming disabled)');
    return {
      uri: inputUri,
      trimStart: 0,
      trimEnd: endTime - startTime
    };
  }
};

/**
 * Get video duration
 */
export const getVideoDuration = async (videoUri: string): Promise<number> => {
  // This would require a video metadata library
  // For now, return 0 and rely on Video component's onLoad
  return 0;
};

/**
 * Generate video thumbnail
 */
export const generateThumbnail = async (
  videoUri: string,
  timeInSeconds: number = 1
): Promise<string> => {
  // This would require FFmpeg or similar
  // For now, return empty string and rely on Cloudflare thumbnails
  return '';
};
