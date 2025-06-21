
// src/lib/redis.ts
import { createClient, type RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379'; // Default to service name from docker-compose

let redisClient: RedisClientType | null = null;
let connectionPromise: Promise<RedisClientType | null> | null = null;

function initializeRedisClient(): Promise<RedisClientType | null> {
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
    if (redisClient?.isOpen === false) {
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
      redisClient = client as RedisClientType; // Cast after successful connect
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
export async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }
  return initializeRedisClient();
}

// Optional: Export a ready check or a function to ensure connection before critical ops
export async function isRedisReady(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    // A more robust check than just isOpen, PING is a lightweight command.
    if (client && client.isOpen) {
      const pong = await client.ping();
      return pong === 'PONG';
    }
    return false;
  } catch (error) {
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
