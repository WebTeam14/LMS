import { Router } from 'express';
import { successResponse } from '../../common/utils/response.js';
import config from '../../config/index.js';
import authRoutes from '../../modules/auth/routes/auth.routes.js';
import userRoutes from '../../modules/users/routes/user.routes.js';
import roleRoutes from '../../modules/rbac/routes/role.routes.js';

const router = Router();

router.get('/', (req, res) => {
  successResponse(res, {
    message: `${config.appName} API v1 Gateway`,
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      health: '/health',
      ready: '/ready',
      modules: {
        phase0: 'Architecture & Foundations',
        phase1: 'Project Foundation & DevOps',
        phase2: 'Auth & RBAC',
      },
    },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);

export default router;
