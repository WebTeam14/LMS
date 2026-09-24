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
  enableMfaSchema,
  disableMfaSchema,
  verifyMfaSchema,
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

// MFA 2-Step verification during login (Public)
router.post('/mfa/verify', authLimiter, validate(verifyMfaSchema), authController.verifyMfa);

// Password recovery & email verification (UNI-016)
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', passwordResetLimiter, validate(verifyEmailSchema), authController.verifyEmail);

// Protected routes (require valid JWT)
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

// MFA Enrollment & Management (Protected)
router.post('/mfa/setup', authenticate, authController.setupMfa);
router.post('/mfa/enable', authenticate, validate(enableMfaSchema), authController.enableMfa);
router.post('/mfa/disable', authenticate, validate(disableMfaSchema), authController.disableMfa);

// Active Sessions & Devices Management (Protected)
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:id', authenticate, authController.revokeSession);
router.delete('/sessions', authenticate, authController.revokeOtherSessions);

export default router;

