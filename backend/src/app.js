import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import errorHandler from './common/middleware/errorHandler.js';
import notFound from './common/middleware/notFound.js';
import { successResponse } from './common/utils/response.js';

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
app.use(limiter);

// Health checks
app.get('/health', (req, res) => {
  successResponse(res, { status: 'ok', service: config.appName, timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  // Later: check MongoDB + Redis connectivity
  successResponse(res, { status: 'ready' });
});

// API routes will be mounted here as modules are added
// Example: app.use(`${config.apiPrefix}/auth`, authRoutes);

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

export default app;
