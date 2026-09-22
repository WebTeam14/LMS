import Redis from 'ioredis';
import config from './index.js';
import logger from '../common/utils/logger.js';

let redisClient = null;

export const initRedis = () => {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('[Redis] Max reconnect attempts reached. Continuing in degraded mode.');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      logger.info('[Redis] Connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.warn(`[Redis] Connection warning: ${err.message}`);
    });

    // Attempt non-blocking connect
    redisClient.connect().catch((err) => {
      logger.warn(`[Redis] Initial connection deferred: ${err.message}`);
    });
  } catch (error) {
    logger.warn(`[Redis] Initialization error: ${error.message}`);
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
      if (redisClient.status === 'ready') {
        await redisClient.quit();
      } else {
        redisClient.disconnect();
      }
      logger.info('[Redis] Connection closed');
    } catch (err) {
      logger.warn(`[Redis] Error during quit: ${err.message}`);
    } finally {
      redisClient = null;
    }
  }
};
