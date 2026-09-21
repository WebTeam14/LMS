import { errorResponse } from '../utils/response.js';
import AppError from '../errors/AppError.js';
import config from '../../config/index.js';

const errorHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return errorResponse(res, err);
  }

  // Zod schema validation errors
  if (err.name === 'ZodError' || Array.isArray(err.issues)) {
    const details = (err.issues || []).map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return errorResponse(res, new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return errorResponse(res, new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
  }

  // Mongoose CastError (invalid ObjectId or type casting)
  if (err.name === 'CastError') {
    return errorResponse(res, new AppError(`Invalid value for ${err.path}: ${err.value}`, 400, 'BAD_REQUEST'));
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return errorResponse(res, new AppError(`Duplicate value for ${field}`, 409, 'CONFLICT'));
  }

  // JSON syntax error (malformed payload from client)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, new AppError('Malformed JSON payload in request body', 400, 'BAD_REQUEST'));
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
