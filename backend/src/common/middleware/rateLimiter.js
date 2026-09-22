import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for public authentication endpoints (login, register).
 * Prevents credential stuffing and brute-force registration.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 30, // 30 requests per 15 minutes in non-test
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
});

/**
 * Strict rate limiter for password reset and token endpoints.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'test' ? 1000 : 10, // 10 requests per hour in non-test
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'PASSWORD_RESET_RATE_LIMITED',
      message: 'Too many password reset requests. Please try again after an hour.',
    },
  },
});
