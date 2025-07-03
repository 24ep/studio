// Invalidate cache
const { getRedisClient, CACHE_KEY_RECRUITMENT_STAGES, deleteCache } = await import('@/lib/redis');
const redisClient = await getRedisClient();
if (redisClient) {
    await deleteCache(CACHE_KEY_RECRUITMENT_STAGES);
    console.log('Recruitment stages cache invalidated due to update.');
} 