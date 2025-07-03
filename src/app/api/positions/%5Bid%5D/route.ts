// Invalidate cache
const { getRedisClient, CACHE_KEY_POSITIONS } = await import('@/lib/redis');
const redisClient = await getRedisClient();
if (redisClient) {
    await redisClient.del(CACHE_KEY_POSITIONS);
    console.log('Positions cache invalidated due to update.');
} 