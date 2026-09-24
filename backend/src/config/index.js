import dotenv from 'dotenv';
dotenv.config();

const env = process.env.NODE_ENV || 'development';

// Parse CORS origin: supports comma-separated list or single origin string
const rawCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsOrigin = rawCorsOrigin.includes(',')
  ? rawCorsOrigin.split(',').map((o) => o.trim())
  : rawCorsOrigin;

const accessSecret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';

const isWeakSecret = (sec) => {
  if (!sec || typeof sec !== 'string') return true;
  if (sec.trim().length < 32) return true;
  const lower = sec.toLowerCase();
  const prohibited = ['dev', 'change', 'placeholder', 'example', 'secret', 'default', 'test', 'password', 'sample'];
  return prohibited.some((token) => lower.includes(token));
};

// In production, enforce that secrets are not default placeholders and have sufficient entropy
if (env === 'production') {
  if (isWeakSecret(process.env.JWT_ACCESS_SECRET)) {
    throw new Error('[Security] JWT_ACCESS_SECRET must be explicitly set to a high-entropy string of at least 32 characters in production without placeholder terms.');
  }
  if (isWeakSecret(process.env.JWT_REFRESH_SECRET)) {
    throw new Error('[Security] JWT_REFRESH_SECRET must be explicitly set to a high-entropy string of at least 32 characters in production without placeholder terms.');
  }
}

const config = {
  env,
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/unisphere',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  corsOrigin,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  appName: process.env.APP_NAME || 'UniSphere',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'unisphere',
    region: process.env.S3_REGION || 'us-east-1',
  },
  email: {
    from: process.env.EMAIL_FROM || 'UniSphere Campus <no-reply@unisphere.edu>',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      secure: process.env.SMTP_SECURE === 'true',
    },
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  },
};

export default config;
