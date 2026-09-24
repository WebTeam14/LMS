import Redis from 'ioredis';
import config from './index.js';
import logger from '../common/utils/logger.js';

let redisClient = null;
let hasLoggedDegraded = false;

export const initRedis = () => {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 2) {
          if (!hasLoggedDegraded && config.env !== 'test') {
            logger.warn('[Redis] Offline or max retries reached. Cache and queues running in direct in-process fallback mode.');
            hasLoggedDegraded = true;
          }
          return null; // Stop retrying
        }
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      hasLoggedDegraded = false;
      logger.info('[Redis] Connected successfully');
    });

    redisClient.on('error', (err) => {
      if (config.env !== 'test' && !hasLoggedDegraded) {
        logger.warn(`[Redis] Connection notice: ${err.message || 'Server not reachable'}`);
      }
    });

    // Attempt non-blocking connect
    redisClient.connect().catch((err) => {
      if (config.env !== 'test' && !hasLoggedDegraded) {
        logger.warn(`[Redis] Initial connection deferred: ${err.message || 'Server not reachable'}`);
      }
    });
  } catch (error) {
    if (config.env !== 'test') logger.warn(`[Redis] Initialization notice: ${error.message}`);
  }

  return redisClient;
};

export const isRedisConnected = () => {
  return Boolean(redisClient && (redisClient.status === 'ready' || redisClient.status === 'connect'));
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
