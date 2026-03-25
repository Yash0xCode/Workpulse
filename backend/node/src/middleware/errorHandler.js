/**
 * Error Handler Middleware
 * Catches and formats all errors consistently
 */

import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return sendError(
      res,
      err.code,
      err.message,
      err.details,
      err.statusCode
    );
  }

  // Database errors
  if (err.name === 'SequelizeValidationError') {
    const details = {};
    err.errors.forEach(e => {
      details[e.path] = [e.message];
    });
    return sendError(res, 'VALIDATION_ERROR', 'Validation failed', details, 400);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return sendError(
      res,
      'CONFLICT',
      `${field} already exists`,
      { [field]: ['Already exists'] },
      409
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'INVALID_TOKEN', 'Invalid token', {}, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'TOKEN_EXPIRED', 'Token has expired', {}, 401);
  }

  // Default error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    },
  });
};

export default errorHandler;
