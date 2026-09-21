import { errorResponse } from '../utils/response.js';
import AppError from '../errors/AppError.js';
import config from '../../config/index.js';

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return errorResponse(res, err);
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return errorResponse(res, new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return errorResponse(res, new AppError(`Duplicate value for ${field}`, 409, 'CONFLICT'));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, new AppError('Invalid token', 401, 'UNAUTHORIZED'));
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, new AppError('Token expired', 401, 'UNAUTHORIZED'));
  }

  // Unexpected
  console.error('[Unhandled Error]', err);
  const message = config.env === 'production' ? 'Internal server error' : err.message;
  return errorResponse(res, new AppError(message, 500, 'INTERNAL_ERROR'));
};

export default errorHandler;
