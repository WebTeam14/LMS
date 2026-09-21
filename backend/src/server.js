import http from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import config from './config/index.js';
import mongoose from 'mongoose';
import { initRedis, closeRedis } from './config/redis.js';

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
      console.log(`[Socket.io] Client connected: ${socket.id}`);
      socket.on('disconnect', () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      });
    });

    // 2. Connect MongoDB (async in development so server boots immediately)
    if (config.env === 'development') {
      mongoose
        .connect(config.mongodbUri, { serverSelectionTimeoutMS: 2000 })
        .then(() => console.log('[DB] MongoDB connected'))
        .catch((dbErr) => {
          console.warn('[DB] MongoDB connection warning:', dbErr.message);
          console.warn('[DB] Running in development mode with MongoDB disconnected. Start Docker or MongoDB service.');
        });
    } else {
      await mongoose.connect(config.mongodbUri);
      console.log('[DB] MongoDB connected');
    }

    // 3. Connect Redis
    initRedis();

    // 4. Start HTTP Server
    httpServer.listen(config.port, () => {
      console.log(`[Server] ${config.appName} running on port ${config.port} (${config.env})`);
      console.log(`[API] Base path: ${config.apiPrefix}`);
      console.log(`[Socket.io] Realtime gateway enabled`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`[Server] ${signal} received. Shutting down...`);
      if (httpServer) {
        httpServer.close(async () => {
          if (io) io.close();
          if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('[DB] MongoDB connection closed');
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
    console.error('[Startup Error]', err);
    process.exit(1);
  }
};

start();
