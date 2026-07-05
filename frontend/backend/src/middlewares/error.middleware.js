const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  AppError,
} = require('../utils/errors');

/**
 * Central error handler middleware
 * Handles both operational and unexpected errors
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error caught:', {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
  });

  // Default error response
  let statusCode = 500;
  let response = {
    success: false,
    message: 'Internal server error',
  };

  // Handle ValidationError
  if (err instanceof ValidationError) {
    statusCode = 400;
    response = {
      success: false,
      message: err.message,
      errors: err.errors,
    };
  }
  // Handle AuthenticationError
  else if (err instanceof AuthenticationError) {
    statusCode = 401;
    response = {
      success: false,
      message: err.message,
      code: 'AUTHENTICATION_REQUIRED',
    };
  }
  // Handle AuthorizationError
  else if (err instanceof AuthorizationError) {
    statusCode = 403;
    response = {
      success: false,
      message: err.message,
      code: 'FORBIDDEN',
    };
  }
  // Handle NotFoundError
  else if (err instanceof NotFoundError) {
    statusCode = 404;
    response = {
      success: false,
      message: err.message,
      code: 'NOT_FOUND',
    };
  }
  // Handle ConflictError
  else if (err instanceof ConflictError) {
    statusCode = 409;
    response = {
      success: false,
      message: err.message,
      code: err.code || 'CONFLICT',
    };
  }
  // Handle MongoDB duplicate key error (E11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    response = {
      success: false,
      message: `${field} already exists`,
      code: 'DUPLICATE_ENTRY',
      field,
    };
  }
  // Handle MongoDB validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    response = {
      success: false,
      message: 'Validation error',
      errors,
    };
  }
  // Handle Mongoose CastError (invalid ID format)
  else if (err.name === 'CastError') {
    statusCode = 400;
    response = {
      success: false,
      message: 'Invalid ID format',
      field: err.path,
    };
  }
  // Handle custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    response = {
      success: false,
      message: err.message,
      ...(err.code && { code: err.code }),
    };
  }
  // Handle unexpected errors (do not expose details)
  else if (err.message) {
    // Only expose safe error messages in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    response = {
      success: false,
      message: isDevelopment ? err.message : 'Internal server error',
      ...(isDevelopment && { stack: err.stack }),
    };
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found middleware
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Cannot find ${req.originalUrl} on this server`);
  next(error);
};

/**
 * Async handler wrapper for routes
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
