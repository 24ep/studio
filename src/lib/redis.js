// src/lib/redis.ts
import { createClient } from 'redis';
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379'; // Default to service name from docker-compose
let redisClient = null;
let connectionPromise = null;
function initializeRedisClient() {
    // If we're already connected or connecting, return the existing promise/client
    if (connectionPromise) {
        return connectionPromise;
    }
    console.log('Attempting to connect to Redis...');
    const client = createClient({
        url: redisUrl,
        socket: {
            connectTimeout: 5000, // 5 seconds
            reconnectStrategy: (retries) => Math.min(retries * 500, 3000), // Exponential backoff
        },
    });
    client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        // When a persistent error occurs, reset the connection promise to allow for a fresh reconnect attempt
        if ((redisClient === null || redisClient === void 0 ? void 0 : redisClient.isOpen) === false) {
            redisClient = null;
            connectionPromise = null;
        }
    });
    client.on('connect', () => console.log('Connecting to Redis server...'));
    client.on('ready', () => console.log('Redis client is ready.'));
    client.on('reconnecting', () => console.log('Reconnecting to Redis server...'));
    client.on('end', () => {
        console.log('Redis connection closed.');
        redisClient = null;
        connectionPromise = null;
    });
    connectionPromise = client.connect()
        .then(() => {
        console.log('Redis client connection established.');
        redisClient = client; // Cast after successful connect
        return redisClient;
    })
        .catch((err) => {
        console.error('Failed to connect to Redis during initialization:', err);
        connectionPromise = null; // Reset promise on failure to allow retry
        return null;
    });
    return connectionPromise;
}
// getRedisClient is the single entry point to get a connected client.
// It will lazily initialize the connection on the first call.
export async function getRedisClient() {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }
    return initializeRedisClient();
}
// Optional: Export a ready check or a function to ensure connection before critical ops
export async function isRedisReady() {
    try {
        const client = await getRedisClient();
        // A more robust check than just isOpen, PING is a lightweight command.
        if (client && client.isOpen) {
            const pong = await client.ping();
            return pong === 'PONG';
        }
        return false;
    }
    catch (error) {
        console.warn("Redis readiness check failed:", error);
        return false;
    }
}
export default getRedisClient; // Default export for convenience
// Constants for cache
export const CACHE_KEY_RECRUITMENT_STAGES = 'cache:recruitment_stages';
export const CACHE_EXPIRY_SECONDS_STAGES = 3600; // 1 hour
export const CACHE_KEY_POSITIONS = 'cache:positions';
export const CACHE_EXPIRY_SECONDS_POSITIONS = 3600; // 1 hour
export const CACHE_KEY_USERS = 'cache:users';
export const CACHE_EXPIRY_SECONDS_USERS = 1800; // 30 minutes
// Real-time collaboration constants
export const REALTIME_KEYS = {
    PRESENCE: 'realtime:presence',
    COLLABORATION: 'realtime:collaboration',
    NOTIFICATIONS: 'realtime:notifications',
    CANDIDATE_UPDATES: 'realtime:candidate_updates',
    POSITION_UPDATES: 'realtime:position_updates',
    USER_ACTIVITY: 'realtime:user_activity',
};
// Real-time collaboration functions
export async function updateUserPresence(userId, presence) {
    try {
        const client = await getRedisClient();
        if (!client)
            return;
        const key = `${REALTIME_KEYS.PRESENCE}:${userId}`;
        const fullPresence = Object.assign({ userId, userName: presence.userName || '', userRole: presence.userRole || '', currentPage: presence.currentPage || '', lastActivity: Date.now(), isOnline: true }, presence);
        await client.hSet(key, Object.fromEntries(Object.entries(fullPresence).map(([k, v]) => [k, String(v)])));
        await client.expire(key, 300); // Expire after 5 minutes of inactivity
    }
    catch (error) {
        console.error('Failed to update user presence:', error);
    }
}
export async function removeUserPresence(userId) {
    try {
        const client = await getRedisClient();
        if (!client)
            return;
        const key = `${REALTIME_KEYS.PRESENCE}:${userId}`;
        await client.del(key);
    }
    catch (error) {
        console.error('Failed to remove user presence:', error);
    }
}
export async function getOnlineUsers() {
    try {
        const client = await getRedisClient();
        if (!client)
            return [];
        const pattern = `${REALTIME_KEYS.PRESENCE}:*`;
        const keys = await client.keys(pattern);
        if (keys.length === 0)
            return [];
        const presences = [];
        for (const key of keys) {
            const presence = await client.hGetAll(key);
            if (presence.userId && presence.isOnline === 'true') {
                presences.push({
                    userId: presence.userId,
                    userName: presence.userName || '',
                    userRole: presence.userRole || '',
                    currentPage: presence.currentPage || '',
                    lastActivity: parseInt(presence.lastActivity || '0'),
                    isOnline: true,
                });
            }
        }
        return presences.sort((a, b) => b.lastActivity - a.lastActivity);
    }
    catch (error) {
        console.error('Failed to get online users:', error);
        return [];
    }
}
// Collaboration event functions
export async function publishCollaborationEvent(event) {
    try {
        const client = await getRedisClient();
        if (!client)
            return;
        const fullEvent = Object.assign(Object.assign({}, event), { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, timestamp: Date.now() });
        const key = `${REALTIME_KEYS.COLLABORATION}:${event.entityType}:${event.entityId}`;
        await client.lPush(key, JSON.stringify(fullEvent));
        await client.lTrim(key, 0, 99); // Keep only last 100 events
        await client.expire(key, 86400); // Expire after 24 hours
        // Also publish to general collaboration stream
        await client.publish('collaboration_events', JSON.stringify(fullEvent));
    }
    catch (error) {
        console.error('Failed to publish collaboration event:', error);
    }
}
export async function getCollaborationEvents(entityType, entityId, limit = 50) {
    try {
        const client = await getRedisClient();
        if (!client)
            return [];
        const key = `${REALTIME_KEYS.COLLABORATION}:${entityType}:${entityId}`;
        const events = await client.lRange(key, 0, limit - 1);
        return events
            .map(event => JSON.parse(event))
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    catch (error) {
        console.error('Failed to get collaboration events:', error);
        return [];
    }
}
// Notification functions
export async function createNotification(notification) {
    try {
        const client = await getRedisClient();
        if (!client)
            return;
        const fullNotification = Object.assign(Object.assign({}, notification), { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, timestamp: Date.now(), read: false });
        const key = `${REALTIME_KEYS.NOTIFICATIONS}:${notification.targetUserId || 'global'}`;
        await client.lPush(key, JSON.stringify(fullNotification));
        await client.lTrim(key, 0, 999); // Keep last 1000 notifications
        await client.expire(key, 604800); // Expire after 7 days
        // Publish notification event
        await client.publish('notifications', JSON.stringify(fullNotification));
    }
    catch (error) {
        console.error('Failed to create notification:', error);
    }
}
export async function getUserNotifications(userId, limit = 50) {
    try {
        const client = await getRedisClient();
        if (!client)
            return [];
        const userKey = `${REALTIME_KEYS.NOTIFICATIONS}:${userId}`;
        const globalKey = `${REALTIME_KEYS.NOTIFICATIONS}:global`;
        const [userNotifications, globalNotifications] = await Promise.all([
            client.lRange(userKey, 0, limit - 1),
            client.lRange(globalKey, 0, limit - 1),
        ]);
        const allNotifications = [
            ...userNotifications.map(n => (Object.assign(Object.assign({}, JSON.parse(n)), { isGlobal: false }))),
            ...globalNotifications.map(n => (Object.assign(Object.assign({}, JSON.parse(n)), { isGlobal: true }))),
        ];
        return allNotifications
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    catch (error) {
        console.error('Failed to get user notifications:', error);
        return [];
    }
}
export async function markNotificationAsRead(userId, notificationId) {
    try {
        const client = await getRedisClient();
        if (!client)
            return;
        const userKey = `${REALTIME_KEYS.NOTIFICATIONS}:${userId}`;
        const notifications = await client.lRange(userKey, 0, -1);
        for (let i = 0; i < notifications.length; i++) {
            const notification = JSON.parse(notifications[i]);
            if (notification.id === notificationId) {
                notification.read = true;
                await client.lSet(userKey, i, JSON.stringify(notification));
                break;
            }
        }
    }
    catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}
// Cache management functions
export async function setCache(key, data, expirySeconds = 3600) {
    try {
        const client = await getRedisClient();
        if (!client)
            return;
        await client.setEx(key, expirySeconds, JSON.stringify(data));
    }
    catch (error) {
        console.error('Failed to set cache:', error);
    }
}
export async function getCache(key) {
    try {
        const client = await getRedisClient();
        if (!client)
            return null;
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (error) {
        console.error('Failed to get cache:', error);
        return null;
    }
}
export async function deleteCache(key) {
    try {
        const client = await getRedisClient();
        if (!client)
            return;
        await client.del(key);
    }
    catch (error) {
        console.error('Failed to delete cache:', error);
    }
}
export async function invalidateCachePattern(pattern) {
    try {
        const client = await getRedisClient();
        if (!client)
            return;
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
    }
    catch (error) {
        console.error('Failed to invalidate cache pattern:', error);
    }
}
// Real-time data synchronization
export async function subscribeToChannel(channel, callback) {
    try {
        const client = await getRedisClient();
        if (!client)
            return;
        await client.subscribe(channel, (message) => {
            callback(message);
        });
    }
    catch (error) {
        console.error('Failed to subscribe to channel:', error);
    }
}
export async function unsubscribeFromChannel(channel) {
    try {
        const client = await getRedisClient();
        if (!client)
            return;
        await client.unsubscribe(channel);
    }
    catch (error) {
        console.error('Failed to unsubscribe from channel:', error);
    }
}
// Rate limiting for API endpoints
export async function checkRateLimit(key, limit, windowSeconds) {
    try {
        const client = await getRedisClient();
        if (!client)
            return { allowed: true, remaining: limit, resetTime: Date.now() + windowSeconds * 1000 };
        const current = await client.incr(key);
        if (current === 1) {
            await client.expire(key, windowSeconds);
        }
        const ttl = await client.ttl(key);
        const remaining = Math.max(0, limit - current);
        const resetTime = Date.now() + ttl * 1000;
        return {
            allowed: current <= limit,
            remaining,
            resetTime,
        };
    }
    catch (error) {
        console.error('Failed to check rate limit:', error);
        return { allowed: true, remaining: limit, resetTime: Date.now() + windowSeconds * 1000 };
    }
}
