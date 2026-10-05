const { getRedisClient, isRedisConnected, inMemoryCache } = require('../config/redis');

const requestsPerMinute = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60', 10);

const isAllowed = async (apiKeyPrefix) => {
  const currentMinute = Math.floor(Date.now() / 60000);
  const key = `rate:${apiKeyPrefix}:${currentMinute}`;

  const redis = getRedisClient();
  if (redis && isRedisConnected()) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, 90);
      }
      return count <= requestsPerMinute;
    } catch (err) {
      console.warn(`[RateLimiter] Redis error: ${err.message}, falling back to in-memory`);
    }
  }

  // In-memory fallback
  const now = Date.now();
  // Clean up entries older than 2 minutes
  for (const [k, val] of inMemoryCache.entries()) {
    if (val.expiresAt && val.expiresAt < now) {
      inMemoryCache.delete(k);
    }
  }

  const existing = inMemoryCache.get(key) || { count: 0, expiresAt: now + 90000 };
  existing.count += 1;
  inMemoryCache.set(key, existing);
  return existing.count <= requestsPerMinute;
};

module.exports = { isAllowed, requestsPerMinute };
