import { DocumentDirectoryPath, writeFile, readFile, unlink, stat } from 'react-native-fs';
import { createHash } from 'react-native-quick-md5';

const VIDEO_CACHE_DIR = `${DocumentDirectoryPath}/video_cache`;
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
const CACHE_EXPIRY_DAYS = 7;

interface CachedVideo {
  videoUrl: string;
  filePath: string;
  createdAt: number;
  size: number;
}

class VideoCacheService {
  private cacheIndex: Map<string, CachedVideo> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    try {
      await this.setupCacheDirectory();
      await this.cleanupExpiredCache();
      this.initialized = true;
    } catch (error) {
      console.warn('VideoCacheService initialization failed:', error);
    }
  }

  private async setupCacheDirectory() {
    try {
      const exists = await stat(VIDEO_CACHE_DIR);
      if (!exists) {
        // Directory creation handled by react-native-fs on write
      }
    } catch {
      // Directory will be created on first write
    }
  }

  // Generate hash for URL to use as filename
  private getHashedFileName(url: string): string {
    return createHash('md5').update(url).digest('hex') + '.mp4';
  }

  // Get cache file path for a video URL
  async getCachedVideoPath(videoUrl: string): Promise<string | null> {
    try {
      await this.initialize();
      const hash = this.getHashedFileName(videoUrl);
      const filePath = `${VIDEO_CACHE_DIR}/${hash}`;
      
      const fileStats = await stat(filePath);
      if (fileStats && fileStats.isFile && fileStats.size > 0) {
        return filePath;
      }
    } catch (error) {
      // File doesn't exist or error reading
    }
    return null;
  }

  // Prefetch and cache a video
  async prefetchVideo(videoUrl: string): Promise<boolean> {
    try {
      await this.initialize();

      // Check if already cached
      const existingPath = await this.getCachedVideoPath(videoUrl);
      if (existingPath) {
        return true;
      }

      // Check cache size and cleanup if needed
      await this.ensureCacheSpace();

      // Fetch video
      const response = await fetch(videoUrl, {
        method: 'GET',
        timeout: 30000, // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      const hash = this.getHashedFileName(videoUrl);
      const filePath = `${VIDEO_CACHE_DIR}/${hash}`;

      await writeFile(filePath, base64, 'base64');

      // Update cache index
      this.cacheIndex.set(videoUrl, {
        videoUrl,
        filePath,
        createdAt: Date.now(),
        size: blob.size,
      });

      return true;
    } catch (error) {
      console.warn('Video prefetch failed:', videoUrl, error);
      return false;
    }
  }

  // Get URL - returns either cached local path or original URL
  async getVideoUrl(videoUrl: string): Promise<string> {
    try {
      const cachedPath = await this.getCachedVideoPath(videoUrl);
      if (cachedPath) {
        return `file://${cachedPath}`;
      }
    } catch (error) {
      console.warn('Error getting cached video:', error);
    }
    return videoUrl; // Fallback to original URL
  }

  // Cleanup expired cache files
  private async cleanupExpiredCache() {
    try {
      const expiryTime = Date.now() - (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      const entries = Array.from(this.cacheIndex.entries());

      for (const [url, cacheData] of entries) {
        if (cacheData.createdAt < expiryTime) {
          try {
            await unlink(cacheData.filePath);
            this.cacheIndex.delete(url);
          } catch (error) {
            console.warn('Failed to delete expired cache file:', error);
          }
        }
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  // Ensure cache doesn't exceed max size
  private async ensureCacheSpace(requiredSize: number = 50 * 1024 * 1024) {
    try {
      let totalSize = Array.from(this.cacheIndex.values()).reduce(
        (sum, item) => sum + item.size,
        0
      );

      if (totalSize + requiredSize > MAX_CACHE_SIZE) {
        // Remove oldest files first
        const sorted = Array.from(this.cacheIndex.entries())
          .sort((a, b) => a[1].createdAt - b[1].createdAt);

        for (const [url, cacheData] of sorted) {
          if (totalSize + requiredSize <= MAX_CACHE_SIZE) break;

          try {
            await unlink(cacheData.filePath);
            this.cacheIndex.delete(url);
            totalSize -= cacheData.size;
          } catch (error) {
            console.warn('Failed to delete cache file:', error);
          }
        }
      }
    } catch (error) {
      console.warn('Error ensuring cache space:', error);
    }
  }

  // Convert blob to base64
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Clear all cache
  async clearCache() {
    try {
      const entries = Array.from(this.cacheIndex.entries());
      for (const [url, cacheData] of entries) {
        try {
          await unlink(cacheData.filePath);
        } catch (error) {
          console.warn('Failed to delete cache file:', error);
        }
      }
      this.cacheIndex.clear();
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }

  // Get cache stats
  getCacheStats() {
    const entries = Array.from(this.cacheIndex.values());
    const totalSize = entries.reduce((sum, item) => sum + item.size, 0);
    return {
      fileCount: entries.length,
      totalSize,
      maxSize: MAX_CACHE_SIZE,
    };
  }
}

export default new VideoCacheService();
