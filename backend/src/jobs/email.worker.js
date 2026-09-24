import { Worker } from 'bullmq';
import config from '../config/index.js';
import logger from '../common/utils/logger.js';
import emailService from '../common/services/email.service.js';
import { getRedisClient, isRedisConnected } from '../config/redis.js';

let emailWorker = null;
let hasLoggedWorkerError = false;

const getRedisConnectionOptions = () => {
  try {
    const url = new URL(config.redisUrl);
    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port, 10) || 6379,
      password: url.password || undefined,
      maxRetriesPerRequest: null,
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
 * Start BullMQ email worker process
 */
export const startEmailWorker = () => {
  if (emailWorker || config.env === 'test') return null;

  const redis = getRedisClient();
  if (!isRedisConnected()) {
    logger.info('[EmailWorker] Redis is offline. Email dispatch active via asynchronous direct mode.');
    redis?.once('connect', () => {
      logger.info('[EmailWorker] Redis connection established. Starting BullMQ email worker...');
      startEmailWorker();
    });
    return null;
  }

  try {
    emailWorker = new Worker(
      'email-queue',
      async (job) => {
        logger.info(`[EmailWorker] Processing job ${job.name} (ID: ${job.id})`);

        switch (job.name) {
          case 'VERIFICATION_EMAIL':
            await emailService.sendVerificationEmail(job.data);
            break;
          case 'PASSWORD_RESET_EMAIL':
            await emailService.sendPasswordResetEmail(job.data);
            break;
          case 'PASSWORD_CHANGED_EMAIL':
            await emailService.sendPasswordChangedEmail(job.data);
            break;
          default:
            await emailService.sendMail(job.data);
        }
      },
      {
        connection: getRedisConnectionOptions(),
        concurrency: 5,
      }
    );

    emailWorker.on('completed', (job) => {
      logger.info(`[EmailWorker] Job ${job.name} (ID: ${job.id}) completed successfully.`);
    });

    emailWorker.on('failed', (job, err) => {
      logger.error(`[EmailWorker] Job ${job?.name} (ID: ${job?.id}) failed: ${err.message}`);
    });

    emailWorker.on('error', (err) => {
      if (!hasLoggedWorkerError) {
        logger.warn(`[EmailWorker] Redis connection notice: ${err.message || 'Worker degraded'}`);
        hasLoggedWorkerError = true;
      }
    });

    return emailWorker;
  } catch (err) {
    logger.warn(`[EmailWorker] Could not start BullMQ worker: ${err.message}`);
    return null;
  }
};

export const closeEmailWorker = async () => {
  if (emailWorker) {
    try {
      await emailWorker.close();
      emailWorker = null;
      logger.info('[EmailWorker] Worker stopped gracefully.');
    } catch (err) {
      logger.warn(`[EmailWorker] Error closing worker: ${err.message}`);
    }
  }
};

export default {
  startEmailWorker,
  closeEmailWorker,
};
