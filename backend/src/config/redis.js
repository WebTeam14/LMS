import Redis from 'ioredis';
import config from './index.js';

let redisClient = null;

export const initRedis = () => {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Redis] Max reconnect attempts reached. Continuing in degraded mode.');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redisClient.on('error', (err) => {
      console.warn('[Redis] Connection warning:', err.message);
    });

    // Attempt non-blocking connect
    redisClient.connect().catch((err) => {
      console.warn('[Redis] Initial connection deferred:', err.message);
    });
  } catch (error) {
    console.warn('[Redis] Initialization error:', error.message);
  }

  return redisClient;
};

export const getRedisClient = () => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

export const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('[Redis] Connection closed');
    } catch (err) {
      console.warn('[Redis] Error during quit:', err.message);
    }
  }
};
