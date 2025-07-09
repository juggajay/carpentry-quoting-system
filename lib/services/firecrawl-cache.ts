interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

export class FirecrawlCache {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder: string[] = [];
  private readonly defaultTTL = 15 * 60 * 1000; // 15 minutes
  private readonly maxSize = 1000;

  constructor(private options: CacheOptions = {}) {
    this.options.ttl = this.options.ttl || this.defaultTTL;
    this.options.maxSize = this.options.maxSize || this.maxSize;
  }

  /**
   * Generate a cache key from supplier, category, and URLs
   */
  generateKey(supplier: string, category?: string, urls?: string[]): string {
    const parts = [supplier];
    if (category) parts.push(category);
    if (urls && urls.length > 0) {
      parts.push(urls.sort().join('|'));
    }
    return parts.join(':');
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    
    return entry.data;
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expirationTime = ttl || this.options.ttl!;
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.options.maxSize! && !this.cache.has(key)) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + expirationTime,
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): boolean {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry?: { key: string; age: number };
  } {
    const now = Date.now();
    let oldestEntry;
    
    if (this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder[0];
      const entry = this.cache.get(oldestKey);
      if (entry) {
        oldestEntry = {
          key: oldestKey,
          age: now - entry.timestamp,
        };
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize!,
      hitRate: 0, // Would need to track hits/misses for accurate rate
      oldestEntry,
    };
  }

  /**
   * Remove expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Update access order for LRU eviction
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }
}

// Request deduplication for concurrent requests
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Deduplicate concurrent requests for the same resource
   */
  async deduplicate<T>(
    key: string,
    factory: () => Promise<T>
  ): Promise<T> {
    // Check if there's already a pending request
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Create new request and store promise
    const promise = factory()
      .then(result => {
        this.pendingRequests.delete(key);
        return result;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Check if a request is pending
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// Singleton instances
export const scrapeCache = new FirecrawlCache();
export const requestDeduplicator = new RequestDeduplicator();

// Auto-prune expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    scrapeCache.prune();
  }, 5 * 60 * 1000);
}