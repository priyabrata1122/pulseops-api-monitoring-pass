const Redis = require('ioredis');

let redisClient = null;
let isRedisAvailable = false;

// In-memory fallback structures for rate limiting and queue
const inMemoryCache = new Map();
const inMemoryQueue = [];

const initRedis = () => {
  const redisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);

  if (!redisUrl && !process.env.REDIS_HOST) {
    console.log('[Redis] No Redis URL configured. Using in-memory fallback for rate limiting & check queue.');
    return null;
  }

  try {
    const client = new Redis(redisUrl || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Redis] Connection retry limit reached. Falling back to in-memory mode.');
          return null; // stop retrying
        }
        return Math.min(times * 500, 2000);
      },
      lazyConnect: true,
      enableOfflineQueue: false
    });

    client.on('connect', () => {
      console.log('[Redis] Connected successfully');
      isRedisAvailable = true;
    });

    client.on('error', (err) => {
      console.warn(`[Redis] Error: ${err.message}. Operating with in-memory fallback.`);
      isRedisAvailable = false;
    });

    client.connect().catch((err) => {
      console.warn(`[Redis] Initial connect failed: ${err.message}. Using in-memory fallback.`);
      isRedisAvailable = false;
    });

    redisClient = client;
    return client;
  } catch (err) {
    console.warn(`[Redis] Init failed: ${err.message}. Using in-memory fallback.`);
    isRedisAvailable = false;
    return null;
  }
};

const getRedisClient = () => redisClient;
const isRedisConnected = () => isRedisAvailable;

module.exports = {
  initRedis,
  getRedisClient,
  isRedisConnected,
  inMemoryCache,
  inMemoryQueue,
};
