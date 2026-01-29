/**
 * Phase 4.5 BLUF Cache System
 *
 * Provides caching for generated BLUFs to avoid redundant API calls
 * and improve pipeline performance.
 */

import crypto from 'crypto';
import type {
  ExecutiveBLUF,
  SectionBLUF,
  BLUFCacheEntry,
  BLUFCacheConfig
} from '../types/phase4-5.types.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('phase4-5-cache');

/**
 * BLUF Cache implementation
 * In-memory cache with TTL and LRU eviction
 */
export class BLUFCache {
  private cache: Map<string, BLUFCacheEntry> = new Map();
  private config: BLUFCacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    writes: 0
  };

  constructor(config: BLUFCacheConfig) {
    this.config = config;
    logger.info({ config }, 'BLUFCache initialized');
  }

  /**
   * Get a cached BLUF by key
   */
  async get(key: string): Promise<BLUFCacheEntry | null> {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    const now = new Date();
    const expiresAt = new Date(entry.ttl_expires_at);
    if (now > expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug({ key }, 'Cache entry expired and removed');
      return null;
    }

    this.stats.hits++;
    logger.debug({ key, cached_at: entry.cached_at }, 'Cache hit');

    // Move to end for LRU (delete and re-insert)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry;
  }

  /**
   * Store a BLUF in the cache
   */
  async set(key: string, bluf: ExecutiveBLUF | SectionBLUF): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.ttl_hours * 60 * 60 * 1000);

    const entry: BLUFCacheEntry = {
      bluf,
      cached_at: now.toISOString(),
      ttl_expires_at: expiresAt.toISOString(),
      cache_key: key,
      idm_version: this.generateIDMVersion(bluf)
    };

    // Enforce max entries (LRU eviction)
    while (this.cache.size >= this.config.max_entries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
        logger.debug({ evicted_key: oldestKey }, 'Cache eviction (max entries reached)');
      } else {
        break;
      }
    }

    this.cache.set(key, entry);
    this.stats.writes++;
    logger.debug({ key, expires_at: expiresAt.toISOString() }, 'Cache entry stored');
  }

  /**
   * Check if a key exists in the cache (without retrieving)
   */
  async has(key: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check TTL
    const now = new Date();
    const expiresAt = new Date(entry.ttl_expires_at);
    if (now > expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    logger.info({ cleared_entries: size }, 'Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    max_size: number;
    hits: number;
    misses: number;
    hit_rate: number;
    evictions: number;
    writes: number;
  } {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      max_size: this.config.max_entries,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hit_rate: total > 0 ? this.stats.hits / total : 0,
      evictions: this.stats.evictions,
      writes: this.stats.writes
    };
  }

  /**
   * Generate a version hash from BLUF content
   * Used for version tracking
   */
  private generateIDMVersion(bluf: ExecutiveBLUF | SectionBLUF): string {
    const hash = crypto.createHash('sha256');
    hash.update(bluf.full_text);
    return hash.digest('hex').substring(0, 12);
  }

  /**
   * Generate a cache key from IDM data
   */
  static generateCacheKey(
    blufType: string,
    companyId: string,
    idmHash?: string
  ): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${blufType}:${companyId}:${idmHash || 'default'}`);
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Generate an IDM content hash for cache invalidation
   */
  static generateIDMHash(idm: unknown): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(idm));
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Prune expired entries from the cache
   */
  async pruneExpired(): Promise<number> {
    let pruned = 0;
    const now = new Date();

    for (const [key, entry] of this.cache.entries()) {
      const expiresAt = new Date(entry.ttl_expires_at);
      if (now > expiresAt) {
        this.cache.delete(key);
        pruned++;
      }
    }

    if (pruned > 0) {
      logger.info({ pruned_count: pruned }, 'Pruned expired cache entries');
    }

    return pruned;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get entries by prefix
   */
  getByPrefix(prefix: string): BLUFCacheEntry[] {
    const entries: BLUFCacheEntry[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        entries.push(entry);
      }
    }

    return entries;
  }

  /**
   * Invalidate all entries for a specific company
   */
  async invalidateByCompany(companyId: string): Promise<number> {
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (key.includes(companyId)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      logger.info({ company_id: companyId, invalidated_count: invalidated },
        'Invalidated cache entries for company');
    }

    return invalidated;
  }
}

/**
 * Create a BLUF cache instance with default or custom config
 */
export function createBLUFCache(config?: Partial<BLUFCacheConfig>): BLUFCache {
  const defaultConfig: BLUFCacheConfig = {
    enabled: true,
    ttl_hours: 24,
    max_entries: 1000,
    version_tracking: true
  };

  return new BLUFCache({ ...defaultConfig, ...config });
}

export default BLUFCache;
