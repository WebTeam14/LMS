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
      mongoose
        .connect(config.mongodbUri, { serverSelectionTimeoutMS: 2000 })
        .then(() => logger.info('[DB] MongoDB connected'))
        .catch((dbErr) => {
          logger.warn(`[DB] MongoDB connection warning: ${dbErr.message}`);
          logger.warn('[DB] Running in development mode with MongoDB disconnected. Start Docker or MongoDB service.');
        });
    } else {
      await mongoose.connect(config.mongodbUri);
      logger.info('[DB] MongoDB connected');
    }

    // 4. Initialize Redis
    initRedis();

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
