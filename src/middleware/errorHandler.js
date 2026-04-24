const { ERROR_CODES } = require('../config/constants');
const util = require('util');

class AppError extends Error {
  constructor(message, code, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, ERROR_CODES.VAL_001, 400, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, ERROR_CODES.AUTH_001, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, ERROR_CODES.AUTH_003, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, ERROR_CODES.RES_001, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, ERROR_CODES.RES_002, 409);
  }
}

class RateLimitError extends AppError {
  constructor() {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
  }
}

function buildValidationSummary(details) {
  if (!Array.isArray(details) || details.length === 0) {
    return null;
  }

  const groupedBySheet = details.reduce((acc, detail) => {
    if (!detail || typeof detail !== 'object') {
      return acc;
    }

    const sheet = detail.sheet || 'unknown';
    if (!acc[sheet]) {
      acc[sheet] = [];
    }

    acc[sheet].push({
      row: detail.row ?? detail.rowNumber ?? null,
      field: detail.field ?? null,
      message: detail.message || 'Validation error'
    });

    return acc;
  }, {});

  return {
    total: details.length,
    sheets: Object.keys(groupedBySheet).length,
    groupedBySheet
  };
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  const validationSummary = buildValidationSummary(err.details);

  // Log error for debugging
  console.error(`Error: ${err.message}`, {
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method,
    validationSummary: validationSummary || undefined
  });

  if (validationSummary) {
    console.error(
      'Validation failure details:\n' +
      util.inspect(validationSummary.groupedBySheet, { depth: null, maxArrayLength: null, compact: false })
    );
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VAL_001,
        message: 'Validation error',
        details
      }
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: ERROR_CODES.VAL_004,
        message: `Duplicate entry for ${field}`,
        details: { field, value: err.keyValue[field] }
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTH_001,
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTH_002,
        message: 'Token expired'
      }
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const code = err.code || ERROR_CODES.SYS_001;
  const message = err.isOperational ? err.message : 'Internal server error';

  const errorResponse = {
    code,
    message,
    details: err.details || null
  };

  if (validationSummary) {
    errorResponse.validationSummary = validationSummary;
  }

  res.status(statusCode).json({
    success: false,
    error: errorResponse
  });
};

// Async handler wrapper to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler
};
