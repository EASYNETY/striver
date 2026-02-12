import { Alert, Platform } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';
import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadVideoToCloudflare, UploadProgress } from './cloudflareVideoService';
import { trimVideo } from './videoProcessingService';

interface UploadTask {
    id: string;
    videoUri: string;
    caption: string;
    hashtags: string[];
    squadId?: string;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    progress: number;
    error?: string;
    attempts: number;
    trimStart?: number;
    trimEnd?: number;
    totalDuration?: number;
    responseTo?: string;
}

class BackgroundUploadService {
    private uploadQueue: Map<string, UploadTask> = new Map();
    private channelId = 'video_uploads';

    async initialize() {
        // Create notification channel for Android
        await notifee.createChannel({
            id: this.channelId,
            name: 'Video Uploads',
            importance: AndroidImportance.HIGH,
            sound: 'default',
        });
    }

    async queueUpload(
        videoUri: string,
        caption: string,
        hashtags: string[],
        squadId?: string,
        trimStart?: number,
        trimEnd?: number,
        totalDuration?: number,
        responseTo?: string
    ): Promise<string> {
        const uploadId = `upload_${Date.now()}`;

        const task: UploadTask = {
            id: uploadId,
            videoUri,
            caption,
            hashtags,
            squadId,
            status: 'pending',
            progress: 0,
            attempts: 0,
            trimStart,
            trimEnd,
            totalDuration,
            responseTo
        };

        this.uploadQueue.set(uploadId, task);
        await AsyncStorage.setItem(`upload_${uploadId}`, JSON.stringify(task));

        // Show initial notification
        await notifee.displayNotification({
            id: uploadId,
            title: 'Uploading Video',
            body: caption || 'Your video is being uploaded...',
            android: {
                channelId: this.channelId,
                progress: {
                    max: 100,
                    current: 0,
                },
                ongoing: true,
                onlyAlertOnce: true,
                importance: AndroidImportance.HIGH,
            },
            ios: {
                sound: 'default',
                critical: true,
            },
        });

        // Start upload immediately
        this.processUpload(uploadId);

        return uploadId;
    }

    private async processUpload(uploadId: string) {
        const task = this.uploadQueue.get(uploadId);
        if (!task || task.status === 'uploading') return;

        try {
            task.status = 'uploading';
            task.attempts += 1;
            this.uploadQueue.set(uploadId, task);

            console.log(`[BackgroundUpload] Starting upload ${uploadId} (Attempt ${task.attempts})`);

            // Step 1: Trim video if needed
            let videoToUpload = task.videoUri;
            const needsTrimming = task.trimStart !== undefined && 
                                  task.trimEnd !== undefined && 
                                  task.totalDuration !== undefined &&
                                  (task.trimStart > 0.1 || task.trimEnd < task.totalDuration - 0.5);

            if (needsTrimming) {
                console.log(`[BackgroundUpload] Trimming video: ${task.trimStart}s to ${task.trimEnd}s`);
                
                await this.updateNotification(
                    uploadId,
                    'Preparing video...',
                    5
                );

                try {
                    const trimResult = await trimVideo(
                        task.videoUri,
                        task.trimStart!,
                        task.trimEnd!
                    );
                    
                    videoToUpload = trimResult.uri;
                    console.log(`[BackgroundUpload] Video trimmed successfully: ${videoToUpload}`);
                    
                    // Reset trim markers since video is now trimmed
                    task.trimStart = 0;
                    task.trimEnd = trimResult.trimEnd;
                    task.totalDuration = trimResult.trimEnd;
                } catch (trimError) {
                    console.error('[BackgroundUpload] Trimming failed, uploading original:', trimError);
                    // Continue with original video if trimming fails
                }
            }

            // Step 2: Perform the actual upload using Cloudflare service
            await uploadVideoToCloudflare(
                videoToUpload,
                {
                    caption: task.caption,
                    hashtags: task.hashtags,
                    challengeId: task.squadId,
                    responseTo: task.responseTo,
                    trimStart: task.trimStart,
                    trimEnd: task.trimEnd,
                    totalDuration: task.totalDuration
                },
                async (progress: UploadProgress) => {
                    task.progress = progress.percentage;
                    this.uploadQueue.set(uploadId, task);

                    // Throttle notification updates for better performance
                    if (progress.percentage % 10 === 0 || progress.percentage > 95) {
                        await this.updateNotification(
                            uploadId,
                            `Uploading... ${progress.percentage}%`,
                            progress.percentage
                        );
                    }
                }
            );

            console.log(`[BackgroundUpload] Upload ${uploadId} completed`);

            // Award coins...
            if (task.squadId || task.responseTo) {
                try {
                    const { RewardService } = require('../api/rewardService');
                    const { firebaseAuth: auth } = require('../api/firebase');
                    const currentUser = auth.currentUser;

                    if (currentUser) {
                        const activityType = task.squadId ? 'participate_legend_challenge' : 'post_response';
                        await RewardService.trackActivity(currentUser.uid, activityType);
                        console.log(`[BackgroundUpload] Awarded coins for ${activityType}`);
                    }
                } catch (rewardError) {
                    console.error('[BackgroundUpload] Failed to award coins:', rewardError);
                }
            }

            // Mark as completed
            task.status = 'completed';
            task.progress = 100;
            this.uploadQueue.set(uploadId, task);

            // Show success notification...
            await notifee.displayNotification({
                id: uploadId,
                title: '✅ Video Uploaded!',
                body: 'Your video is now live on your feed',
                android: {
                    channelId: this.channelId,
                    ongoing: false,
                    importance: AndroidImportance.HIGH,
                    visibility: 1, // Public
                },
                ios: {
                    sound: 'default',
                    critical: true,
                },
            });

            // Clean up
            setTimeout(async () => {
                await notifee.cancelNotification(uploadId);
                this.uploadQueue.delete(uploadId);
                await AsyncStorage.removeItem(`upload_${uploadId}`);
            }, 5000);

        } catch (error: any) {
            console.error(`[BackgroundUpload] Upload ${uploadId} failed (Attempt ${task.attempts}):`, error);

            if (task.attempts < 3) {
                console.log(`[BackgroundUpload] Retrying ${uploadId} in 5 seconds...`);
                task.status = 'pending';
                this.uploadQueue.set(uploadId, task);

                await this.updateNotification(uploadId, `Retrying upload... (Attempt ${task.attempts + 1})`, task.progress);

                setTimeout(() => this.processUpload(uploadId), 5000);
            } else {
                task.status = 'failed';
                task.error = error.message;
                this.uploadQueue.set(uploadId, task);

                // Show error notification
                await notifee.displayNotification({
                    id: uploadId,
                    title: '❌ Upload Failed',
                    body: error.message || 'Failed to upload video. Tap to retry.',
                    android: {
                        channelId: this.channelId,
                        ongoing: false,
                        actions: [
                            {
                                title: 'Retry',
                                pressAction: { id: `retry_${uploadId}` },
                            },
                        ],
                    },
                });
            }
        }
    }

    private async updateNotification(uploadId: string, body: string, progress: number) {
        await notifee.displayNotification({
            id: uploadId,
            title: 'Uploading Video',
            body,
            android: {
                channelId: this.channelId,
                progress: {
                    max: 100,
                    current: progress,
                },
                ongoing: true,
                onlyAlertOnce: true,
            },
        });
    }

    async retryUpload(uploadId: string) {
        const taskJson = await AsyncStorage.getItem(`upload_${uploadId}`);
        if (!taskJson) return;

        const task: UploadTask = JSON.parse(taskJson);
        task.status = 'pending';
        task.progress = 0;
        task.error = undefined;

        this.uploadQueue.set(uploadId, task);
        await this.processUpload(uploadId);
    }

    async getPendingUploads(): Promise<UploadTask[]> {
        const keys = await AsyncStorage.getAllKeys();
        const uploadKeys = keys.filter(k => k.startsWith('upload_'));
        const tasks: UploadTask[] = [];

        for (const key of uploadKeys) {
            const taskJson = await AsyncStorage.getItem(key);
            if (taskJson) {
                tasks.push(JSON.parse(taskJson));
            }
        }

        return tasks.filter(t => t.status === 'pending' || t.status === 'uploading');
    }
}

export default new BackgroundUploadService();
