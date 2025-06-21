// src/lib/redis.ts
import { createClient, type RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379'; // Default to service name from docker-compose

let redisClient: RedisClientType | null = null;
let isConnecting = false;
let connectionPromise: Promise<RedisClientType | null> | null = null;

async function initializeRedisClient(): Promise<RedisClientType | null> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  isConnecting = true;
  console.log('Attempting to connect to Redis...');
  
  const client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 10000, // 10 seconds
      reconnectStrategy: (retries) => Math.min(retries * 500, 3000), // Exponential backoff
    },
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
    // Potentially set redisClient to null or handle reconnection state more explicitly
    // For now, rely on reconnectStrategy. If critical, app might need to stop.
  });

  client.on('connect', () => {
    console.log('Successfully connected to Redis server.');
  });

  client.on('reconnecting', () => {
    console.log('Reconnecting to Redis server...');
  });

  client.on('end', () => {
    console.log('Redis connection closed.');
    redisClient = null; // Mark client as null when connection ends
    connectionPromise = null;
  });
  
  connectionPromise = client.connect()
    .then(() => {
      console.log('Redis client connection established and ready.');
      redisClient = client as RedisClientType; // Cast after successful connect
      isConnecting = false;
      return redisClient;
    })
    .catch((err) => {
      console.error('Failed to connect to Redis during initialization:', err);
      isConnecting = false;
      // redisClient will remain null or its previous state
      return null; 
    });

  return connectionPromise;
}

// Initialize on module load, but don't block server startup
initializeRedisClient().catch(err => {
  console.error("Initial Redis connection attempt failed in background:", err);
});

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }
  // If client is not ready, try to re-initialize/await connection
  return initializeRedisClient();
}

// Optional: Export a ready check or a function to ensure connection before critical ops
export async function isRedisReady(): Promise<boolean> {
  const client = await getRedisClient();
  return client?.isOpen || false;
}

export default getRedisClient; // Default export for convenience

// Constants for cache
export const CACHE_KEY_RECRUITMENT_STAGES = 'cache:recruitment_stages';
export const CACHE_EXPIRY_SECONDS_STAGES = 3600; // 1 hour

export const CACHE_KEY_POSITIONS = 'cache:positions';
export const CACHE_EXPIRY_SECONDS_POSITIONS = 3600; // 1 hour

export const CACHE_KEY_USERS = 'cache:users';
export const CACHE_EXPIRY_SECONDS_USERS = 1800; // 30 minutes
