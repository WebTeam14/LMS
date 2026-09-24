import { Queue } from 'bullmq';
import config from '../config/index.js';
import logger from '../common/utils/logger.js';
import emailService from '../common/services/email.service.js';
import { getRedisClient, isRedisConnected } from '../config/redis.js';

let emailQueue = null;
let redisAvailable = true;

/**
 * Helper to parse ioredis connection options from redisUrl string
 */
const getRedisConnectionOptions = () => {
  try {
    const url = new URL(config.redisUrl);
    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
      maxRetriesPerRequest: null, // Required by BullMQ
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
};

/**
 * Get or initialize BullMQ email queue
 */
export const getEmailQueue = () => {
  if (emailQueue) return emailQueue;

  const redis = getRedisClient();
  if (!isRedisConnected()) {
    redis?.once('connect', () => {
      getEmailQueue();
    });
    return null;
  }

  try {
    emailQueue = new Queue('email-queue', {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });

    emailQueue.on('error', (err) => {
      redisAvailable = false;
      if (config.env !== 'test') {
        logger.warn(`[EmailQueue] Redis error notice: ${err.message || 'Queue degraded'}`);
      }
    });

    return emailQueue;
  } catch (err) {
    redisAvailable = false;
    logger.warn(`[EmailQueue] Could not initialize BullMQ queue: ${err.message}`);
    return null;
  }
};

/**
 * Queue an email job asynchronously (or process directly if Redis is offline)
 */
export const queueEmail = async (jobName, data) => {
  const queue = getEmailQueue();

  if (queue && redisAvailable) {
    try {
      await queue.add(jobName, data);
      return { queued: true };
    } catch (err) {
      logger.warn(`[EmailQueue] Queue.add failed, falling back to direct send: ${err.message}`);
    }
  }

  // Fallback: execute directly asynchronously without blocking
  setImmediate(async () => {
    try {
      switch (jobName) {
        case 'VERIFICATION_EMAIL':
          await emailService.sendVerificationEmail(data);
          break;
        case 'PASSWORD_RESET_EMAIL':
          await emailService.sendPasswordResetEmail(data);
          break;
        case 'PASSWORD_CHANGED_EMAIL':
          await emailService.sendPasswordChangedEmail(data);
          break;
        default:
          await emailService.sendMail(data);
      }
    } catch (directErr) {
      logger.error(`[EmailQueueFallback] Direct email dispatch failed: ${directErr.message}`);
    }
  });

  return { queued: false, direct: true };
};

export default {
  getEmailQueue,
  queueEmail,
};
