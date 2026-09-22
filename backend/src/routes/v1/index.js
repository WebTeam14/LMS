import { Router } from 'express';
import mongoose from 'mongoose';
import { successResponse } from '../../common/utils/response.js';
import config from '../../config/index.js';
import { getRedisClient } from '../../config/redis.js';
import authRoutes from '../../modules/auth/routes/auth.routes.js';
import userRoutes from '../../modules/users/routes/user.routes.js';
import roleRoutes from '../../modules/rbac/routes/role.routes.js';

const router = Router();

// Gateway root
router.get('/', (req, res) => {
  successResponse(res, {
    message: `${config.appName} API v1 Gateway`,
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      health: '/api/v1/health',
      ready: '/api/v1/ready',
      modules: {
        phase0: 'Architecture & Foundations',
        phase1: 'Project Foundation & DevOps',
        phase2: 'Auth & RBAC',
      },
    },
  });
});

// Gateway health check (UNI-002)
router.get('/health', (req, res) => {
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

// Gateway readiness probe
router.get('/ready', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  const redisClient = getRedisClient();
  const isRedisReady = redisClient?.status === 'ready' || redisClient?.status === 'connect';

  successResponse(res, {
    status: isDbReady && isRedisReady ? 'ready' : 'degraded',
    database: isDbReady,
    redis: isRedisReady,
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);

export default router;
