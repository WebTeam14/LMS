import http from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import config from './config/index.js';
import mongoose from 'mongoose';
import { initRedis, closeRedis } from './config/redis.js';
import logger from './common/utils/logger.js';

let io = null;
let httpServer = null;

const start = async () => {
  try {
    // 1. Create HTTP Server & attach Socket.io
    httpServer = http.createServer(app);
    io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigin,
        credentials: true,
      },
    });

    app.set('io', io);

    io.on('connection', (socket) => {
      logger.info(`[Socket.io] Client connected: ${socket.id}`);
      socket.on('disconnect', () => {
        logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
      });
    });

    // 2. Register Mongoose connection event listeners
    mongoose.connection.on('disconnected', () => {
      logger.warn('[DB] MongoDB disconnected');
    });
    mongoose.connection.on('reconnected', () => {
      logger.info('[DB] MongoDB reconnected');
    });

    // 3. Connect MongoDB
    if (config.env === 'development') {
      try {
        await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 2000 });
        logger.info('[DB] MongoDB connected');
        const { seedInitialData } = await import('./common/utils/embeddedDb.js');
        await seedInitialData();
      } catch (dbErr) {
        logger.warn(`[DB] Local MongoDB unreachable (${dbErr.message}). Starting embedded database fallback...`);
        try {
          const { startEmbeddedMongo } = await import('./common/utils/embeddedDb.js');
          await startEmbeddedMongo();
        } catch (embeddedErr) {
          logger.warn(`[DB] Embedded MongoDB unavailable: ${embeddedErr.message}. Running in offline DB mode.`);
        }
      }
    } else {
      await mongoose.connect(config.mongodbUri);
      logger.info('[DB] MongoDB connected');
    }

    // 4. Initialize Redis & Background Jobs
    initRedis();
    const { startEmailWorker } = await import('./jobs/email.worker.js');
    startEmailWorker();

    // 5. Start HTTP Server
    httpServer.listen(config.port, () => {
      logger.info(`[Server] ${config.appName} running on port ${config.port} (${config.env})`);
      logger.info(`[API] Base path: ${config.apiPrefix}`);
      logger.info('[Socket.io] Realtime gateway enabled');
    });

    // 6. Graceful Shutdown
    const shutdown = async (signal) => {
      logger.info(`[Server] ${signal} received. Initiating graceful shutdown...`);
      if (httpServer) {
        httpServer.close(async () => {
          if (io) io.close();
          if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            logger.info('[DB] MongoDB connection closed');
          }
          await closeRedis();
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error(`[Startup Error] ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
};

start();
