import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import validate from '../../../common/middleware/validate.js';
import authenticate from '../../../common/middleware/authenticate.js';
import { authLimiter, passwordResetLimiter } from '../../../common/middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Middleware to optionally authenticate if Bearer token is provided
const optionalAuthenticate = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
};

// Public routes with dedicated rate limiting (UNI-021)
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authLimiter, validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', optionalAuthenticate, validate(logoutSchema), authController.logout);

// Password recovery & email verification (UNI-016)
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', passwordResetLimiter, validate(verifyEmailSchema), authController.verifyEmail);

// Protected routes (require valid JWT)
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
