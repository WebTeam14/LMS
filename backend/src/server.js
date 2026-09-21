import app from './app.js';
import config from './config/index.js';
import mongoose from 'mongoose';

const start = async () => {
  try {
    // Connect MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('[DB] MongoDB connected');

    // Redis connection will be added in Phase 1 / Phase 2

    const server = app.listen(config.port, () => {
      console.log(`[Server] ${config.appName} running on port ${config.port} (${config.env})`);
      console.log(`[API] Base path: ${config.apiPrefix}`);
    });

    const shutdown = async (signal) => {
      console.log(`[Server] ${signal} received. Shutting down...`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('[DB] MongoDB connection closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[Startup Error]', err);
    process.exit(1);
  }
};

start();
