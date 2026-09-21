import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import config from './config/index.js';
import { getRedisClient } from './config/redis.js';
import errorHandler from './common/middleware/errorHandler.js';
import notFound from './common/middleware/notFound.js';
import { successResponse } from './common/utils/response.js';
import v1Routes from './routes/v1/index.js';

const app = express();

// Security headers & basic parsing
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// Health check endpoint (exempt from rate limits for orchestrators & monitoring)
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisClient = getRedisClient();
  const redisStatus = redisClient?.status || 'disconnected';

  successResponse(res, {
    status: 'ok',
    service: config.appName,
    environment: config.env,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    components: {
      database: mongoStatus,
      redis: redisStatus,
    },
  });
});

// Readiness probe for Kubernetes / Docker (exempt from rate limits)
app.get('/ready', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  const redisClient = getRedisClient();
  const isRedisReady = redisClient?.status === 'ready' || redisClient?.status === 'connect';

  successResponse(res, {
    status: isDbReady && isRedisReady ? 'ready' : 'degraded',
    database: isDbReady,
    redis: isRedisReady,
  });
});

// API Rate limiting (applied to business and API routes)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
app.use(config.apiPrefix, limiter);

// API v1 Routes
app.use(config.apiPrefix, v1Routes);

// 404 + centralized error handling
app.use(notFound);
app.use(errorHandler);

export default app;
