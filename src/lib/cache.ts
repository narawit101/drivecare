import { getRedisClient } from './redis';
import { CacheKeys, CachePatterns } from './cache-keys';

/**
 * Get cached data, or execute the fetcher and cache the result.
 * Falls back to fetcher on Redis error (cache is never a blocker).
 */
export async function cacheGet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const redis = await getRedisClient();
    const cached = await redis.get(key);

    if (cached) {
      console.log(`[Cache HIT] ${key}`);
      return JSON.parse(cached) as T;
    }

    console.log(`[Cache MISS] ${key}`);
  } catch (err) {
    console.error(`[Cache ERROR] GET ${key}:`, err);
    // fallthrough — treat Redis failure as cache miss
  }

  // Execute the actual DB query
  const data = await fetcher();

  // Store in cache (fire-and-forget, don't block response)
  try {
    const redis = await getRedisClient();
    await redis.set(key, JSON.stringify(data), { EX: ttlSeconds });
  } catch (err) {
    console.error(`[Cache ERROR] SET ${key}:`, err);
  }

  return data;
}

/**
 * Invalidate one or more specific cache keys.
 */
export async function cacheInvalidate(...keys: string[]): Promise<void> {
  try {
    const redis = await getRedisClient();
    // Filter out undefined or empty string keys
    const validKeys = keys.filter(Boolean);
    if (validKeys.length > 0) {
      await redis.del(validKeys);
      console.log(`[Cache INVALIDATE] ${validKeys.join(', ')}`);
    }
  } catch (err) {
    console.error(`[Cache ERROR] INVALIDATE:`, err);
  }
}

/**
 * Invalidate cache keys matching a glob pattern.
 * Uses SCAN to avoid blocking Redis (safer than KEYS command).
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    let cursor = '0';
    const keysToDelete: string[] = [];

    do {
      const result = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = result.cursor;
      keysToDelete.push(...result.keys);
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
      console.log(`[Cache INVALIDATE PATTERN] ${pattern} → deleted ${keysToDelete.length} keys`);
    }
  } catch (err) {
    console.error(`[Cache ERROR] INVALIDATE PATTERN ${pattern}:`, err);
  }
}

/**
 * Invalidate all cached data related to a booking when it is mutated.
 */
export async function invalidateBooking(
  bookingId: number | string,
  userId?: number | string | null,
  driverId?: number | string | null
): Promise<void> {
  try {
    const promises: Promise<any>[] = [
      cacheInvalidatePattern(CachePatterns.bookingById(bookingId)),
      cacheInvalidatePattern(CachePatterns.allBookingGlobal()),
      cacheInvalidatePattern(CachePatterns.adminDashboardWildcard()),
      cacheInvalidatePattern(CachePatterns.adminJobAssignmentWildcard()),
      cacheInvalidate(
        CacheKeys.adminBookings(),
        CacheKeys.adminBookingsFull(),
        CacheKeys.adminSlips()
      )
    ];

    if (userId) {
      promises.push(cacheInvalidate(CacheKeys.userBookings(userId)));
    }
    if (driverId) {
      promises.push(cacheInvalidatePattern(CachePatterns.driverJobsWildcard(driverId)));
    }

    await Promise.all(promises);
    console.log(`[Cache INVALIDATE BOOKING] booking:${bookingId} user:${userId || 'none'} driver:${driverId || 'none'}`);
  } catch (err) {
    console.error(`[Cache ERROR] Invalidate Booking ${bookingId}:`, err);
  }
}

