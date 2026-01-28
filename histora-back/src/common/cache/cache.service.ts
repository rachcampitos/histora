import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

/**
 * Simple in-memory cache service
 * For production, consider using Redis or @nestjs/cache-manager
 */
@Injectable()
export class CacheService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly logger = new Logger(CacheService.name);
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000; // Maximum entries to prevent memory issues

  /**
   * Get a cached value
   * @param key Cache key
   * @returns Cached value or undefined if not found/expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set a cached value
   * @param key Cache key
   * @param value Value to cache
   * @param ttlMs Time to live in milliseconds (default 5 minutes)
   */
  set<T>(key: string, value: T, ttlMs: number = this.DEFAULT_TTL_MS): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * Delete a cached value
   * @param key Cache key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all entries matching a pattern
   * @param pattern Prefix pattern to match
   */
  deleteByPattern(pattern: string): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * Get or set a cached value (cache-aside pattern)
   * @param key Cache key
   * @param factory Function to generate value if not cached
   * @param ttlMs Time to live in milliseconds
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs: number = this.DEFAULT_TTL_MS,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    // Clean up expired entries first
    this.cleanupExpired();

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }

  /**
   * Evict the oldest entries
   */
  private evictOldest(): void {
    // First cleanup expired entries
    this.cleanupExpired();

    // If still over limit, remove oldest entries
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const keysToDelete = Array.from(this.cache.keys()).slice(
        0,
        Math.floor(this.MAX_CACHE_SIZE * 0.2), // Remove 20%
      );

      for (const key of keysToDelete) {
        this.cache.delete(key);
      }

      this.logger.debug(`Evicted ${keysToDelete.length} cache entries`);
    }
  }

  /**
   * Remove expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}
