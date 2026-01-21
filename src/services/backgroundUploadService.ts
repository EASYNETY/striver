import { Alert } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import postService from '../api/postService';

interface UploadTask {
    id: string;
    videoUri: string;
    caption: string;
    hashtags: string[];
    squadId?: string;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    progress: number;
    error?: string;
}

class BackgroundUploadService {
    private uploadQueue: Map<string, UploadTask> = new Map();
    private channelId = 'video_uploads';

    async initialize() {
        // Create notification channel for Android
        await notifee.createChannel({
            id: this.channelId,
            name: 'Video Uploads',
            importance: AndroidImportance.LOW,
            sound: 'default',
        });
    }

    async queueUpload(videoUri: string, caption: string, hashtags: string[], squadId?: string): Promise<string> {
        const uploadId = `upload_${Date.now()}`;

        const task: UploadTask = {
            id: uploadId,
            videoUri,
            caption,
            hashtags,
            squadId,
            status: 'pending',
            progress: 0,
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
            },
            ios: {
                sound: 'default',
            },
        });

        // Start upload immediately
        this.processUpload(uploadId);

        return uploadId;
    }

    private async processUpload(uploadId: string) {
        const task = this.uploadQueue.get(uploadId);
        if (!task) return;

        try {
            task.status = 'uploading';
            this.uploadQueue.set(uploadId, task);

            console.log(`[BackgroundUpload] Starting upload ${uploadId}`);

            // Update notification to show progress
            await this.updateNotification(uploadId, 'Uploading...', 25);

            // Perform the actual upload
            await postService.createPost({
                videoUri: task.videoUri,
                caption: task.caption,
                hashtags: task.hashtags,
                squadId: task.squadId,
            });

            console.log(`[BackgroundUpload] Upload ${uploadId} completed`);

            // Mark as completed
            task.status = 'completed';
            task.progress = 100;
            this.uploadQueue.set(uploadId, task);

            // Show success notification
            await notifee.displayNotification({
                id: uploadId,
                title: '✅ Video Uploaded!',
                body: 'Your video is now live on your feed',
                android: {
                    channelId: this.channelId,
                    ongoing: false,
                },
                ios: {
                    sound: 'default',
                },
            });

            // Clean up after 5 seconds
            setTimeout(async () => {
                await notifee.cancelNotification(uploadId);
                this.uploadQueue.delete(uploadId);
                await AsyncStorage.removeItem(`upload_${uploadId}`);
            }, 5000);

        } catch (error: any) {
            console.error(`[BackgroundUpload] Upload ${uploadId} failed:`, error);

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
