import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Cache duration in seconds
const CACHE_DURATION = {
  CANDIDATES: 300, // 5 minutes
  POSITIONS: 300,
  USERS: 300,
  GROUPS: 600, // 10 minutes
};

// Helper function to get cached data
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) as T : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

// Helper function to set cached data
export async function setCachedData<T>(
  key: string,
  data: T,
  duration: number = CACHE_DURATION.CANDIDATES
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', duration);
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

// Helper function to invalidate cache
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

// Cache keys
export const CACHE_KEYS = {
  CANDIDATES: (page: number, pageSize: number) => `candidates:${page}:${pageSize}`,
  POSITIONS: (page: number, pageSize: number) => `positions:${page}:${pageSize}`,
  USERS: (page: number, pageSize: number) => `users:${page}:${pageSize}`,
  GROUPS: 'groups',
};

// Preload common data
export async function preloadCommonData() {
  try {
    // Preload first page of candidates
    const candidatesKey = CACHE_KEYS.CANDIDATES(1, 20);
    const positionsKey = CACHE_KEYS.POSITIONS(1, 20);
    const usersKey = CACHE_KEYS.USERS(1, 20);
    const groupsKey = CACHE_KEYS.GROUPS;

    // Set initial cache with empty data to prevent cache misses
    await Promise.all([
      setCachedData(candidatesKey, { candidates: [], total: 0, page: 1, pageSize: 20 }),
      setCachedData(positionsKey, { positions: [], total: 0, page: 1, pageSize: 20 }),
      setCachedData(usersKey, { users: [], total: 0, page: 1, pageSize: 20 }),
      setCachedData(groupsKey, [])
    ]);

    console.log('Common data preloaded successfully');
  } catch (error) {
    console.error('Failed to preload common data:', error);
  }
}

// Warm up cache for specific data
export async function warmupCache<T>(
  key: string,
  fetchData: () => Promise<T>,
  duration: number = CACHE_DURATION.CANDIDATES
): Promise<void> {
  try {
    const data = await fetchData();
    await setCachedData(key, data, duration);
  } catch (error) {
    console.error(`Failed to warm up cache for key ${key}:`, error);
  }
}

export default redis; 