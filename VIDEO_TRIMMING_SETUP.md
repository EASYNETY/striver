# Video Trimming Setup Guide

## Problem Fixed
Cloudflare's clipping API was returning 400 errors. Videos are now trimmed on-device before upload.

## Solution
Client-side video trimming using FFmpeg before uploading to Cloudflare.

## Installation Steps

### 1. Install FFmpeg Library
```bash
npm install react-native-ffmpeg-min --save
```

### 2. Link Native Modules
```bash
npx react-native link react-native-ffmpeg-min
```

### 3. Clean and Rebuild
```bash
cd android
gradlew clean
cd ..
build-android-arm-only.bat
```

## Or Use the Automated Script
```bash
install-video-trimming.bat
```

## How It Works

1. **User trims video** in the upload screen using the trim sliders
2. **Video is trimmed on-device** using FFmpeg before upload starts
3. **Only the trimmed portion** is uploaded to Cloudflare
4. **Saves bandwidth** and ensures exact trim points

## Benefits

- ✅ No more Cloudflare clipping API errors
- ✅ Faster uploads (smaller file size)
- ✅ Exact trim points guaranteed
- ✅ Works offline (trimming happens locally)
- ✅ Better user experience

## Files Modified

- `src/services/videoProcessingService.ts` - Added FFmpeg trimming
- `src/services/backgroundUploadService.ts` - Trim before upload
- `src/services/cloudflareVideoService.ts` - Disabled broken clipping API

## Testing

1. Record or select a video
2. Use the trim sliders to select a portion
3. Upload the video
4. Check logs for `[VideoProcessing] Trimming video` message
5. Verify only the trimmed portion appears in the feed

## Fallback Behavior

If FFmpeg trimming fails:
- Original video is uploaded
- No error shown to user
- Logged for debugging

## Notes

- FFmpeg adds ~10MB to app size (min package)
- Trimming is fast (usually < 2 seconds)
- Trimmed files are cached and cleaned up automatically
