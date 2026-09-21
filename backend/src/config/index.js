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

// In production, enforce that secrets are not default placeholders
if (env === 'production') {
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.includes('dev-access-secret')) {
    throw new Error('[Security] JWT_ACCESS_SECRET must be explicitly set to a secure string in production');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.includes('dev-refresh-secret')) {
    throw new Error('[Security] JWT_REFRESH_SECRET must be explicitly set to a secure string in production');
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
};

export default config;
