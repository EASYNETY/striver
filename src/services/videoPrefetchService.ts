import videoCacheService from './videoCacheService';

interface PrefetchConfig {
  prefetchCount?: number;     // Number of videos to prefetch ahead
  prefetchBehind?: number;    // Number of videos to keep cached behind
  maxConcurrentFetches?: number;
}

class VideoPrefetchService {
  private prefetchConfig: Required<PrefetchConfig> = {
    prefetchCount: 3,           // Prefetch 3 videos ahead
    prefetchBehind: 1,          // Keep 1 video before in cache
    maxConcurrentFetches: 2,    // Max 2 concurrent prefetch operations
  };

  private activePrefetchPromises: Map<string, Promise<any>> = new Map();
  private prefetchQueue: string[] = [];
  private currentFetchCount = 0;

  constructor(config?: PrefetchConfig) {
    if (config) {
      this.prefetchConfig = { ...this.prefetchConfig, ...config };
    }
  }

  /**
   * Prefetch videos around the currently visible index
   */
  async prefetchVideosAround(
    videoUrls: string[],
    currentIndex: number
  ): Promise<void> {
    const { prefetchCount, prefetchBehind, maxConcurrentFetches } = this.prefetchConfig;

    // Clear old prefetch promises
    this.activePrefetchPromises.clear();
    this.prefetchQueue = [];

    // Calculate range to prefetch
    const startIdx = Math.max(0, currentIndex - prefetchBehind);
    const endIdx = Math.min(videoUrls.length - 1, currentIndex + prefetchCount);

    // Queue videos for prefetch
    for (let i = startIdx; i <= endIdx; i++) {
      if (videoUrls[i]) {
        this.prefetchQueue.push(videoUrls[i]);
      }
    }

    // Start prefetching with concurrency limit
    this.processPrefetchQueue(maxConcurrentFetches);
  }

  /**
   * Prefetch a specific list of video URLs
   */
  async prefetchVideos(videoUrls: string[]): Promise<boolean[]> {
    const results = await Promise.all(
      videoUrls.map(url => this.prefetchSingle(url))
    );
    return results;
  }

  /**
   * Prefetch a single video (with deduplication)
   */
  private async prefetchSingle(videoUrl: string): Promise<boolean> {
    // If already prefetching, return existing promise
    if (this.activePrefetchPromises.has(videoUrl)) {
      return this.activePrefetchPromises.get(videoUrl)!;
    }

    // Create prefetch promise
    const prefetchPromise = (async () => {
      try {
        const cachedPath = await videoCacheService.getCachedVideoPath(videoUrl);
        
        // If not cached, prefetch it
        if (!cachedPath) {
          return await videoCacheService.prefetchVideo(videoUrl);
        }
        
        return true; // Already cached
      } catch (error) {
        console.warn(`Prefetch failed for ${videoUrl}:`, error);
        return false;
      }
    })();

    this.activePrefetchPromises.set(videoUrl, prefetchPromise);
    return prefetchPromise;
  }

  /**
   * Process prefetch queue with concurrency control
   */
  private async processPrefetchQueue(maxConcurrent: number): Promise<void> {
    const pending: Promise<boolean>[] = [];

    while (this.prefetchQueue.length > 0 || pending.length > 0) {
      // Fill up to maxConcurrent
      while (pending.length < maxConcurrent && this.prefetchQueue.length > 0) {
        const videoUrl = this.prefetchQueue.shift()!;
        pending.push(this.prefetchSingle(videoUrl));
      }

      // Wait for at least one to complete
      if (pending.length > 0) {
        await Promise.race(pending);
        pending.splice(
          pending.findIndex(p => !p),
          1
        );
      }
    }
  }

  /**
   * Cancel all pending prefetch operations
   */
  cancelPrefetch(): void {
    this.activePrefetchPromises.clear();
    this.prefetchQueue = [];
  }

  /**
   * Get prefetch status
   */
  getPrefetchStatus() {
    return {
      queueLength: this.prefetchQueue.length,
      activePrefetches: this.activePrefetchPromises.size,
      config: this.prefetchConfig,
    };
  }
}

export default new VideoPrefetchService({
  prefetchCount: 3,
  prefetchBehind: 1,
  maxConcurrentFetches: 2,
});
