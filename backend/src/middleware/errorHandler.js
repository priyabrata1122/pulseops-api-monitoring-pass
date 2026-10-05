class AppError extends Error {
  constructor(message, statusCode, errorType = 'Bad Request') {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ResourceNotFoundException extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'Not Found');
  }
}

class UnauthorizedException extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'Forbidden');
  }
}

class BadCredentialsException extends AppError {
  constructor(message = 'Invalid email or password') {
    super(message, 401, 'Unauthorized');
  }
}

class BadRequestException extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400, 'Bad Request');
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let error = err.errorType || 'Internal Server Error';
  let message = err.message || 'An unexpected error occurred';

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    error = 'Not Found';
    message = `Resource not found with id of ${err.value}`;
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    error = 'Bad Request';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already taken: ${err.keyValue ? err.keyValue[field] : ''}`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    error = 'Validation Failed';
    const errors = {};
    Object.values(err.errors).forEach((e) => {
      errors[e.path] = e.message;
    });
    return res.status(statusCode).json({
      status: statusCode,
      error,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  if (statusCode === 500 && process.env.NODE_ENV !== 'test') {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({
    status: statusCode,
    error,
    message,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  AppError,
  ResourceNotFoundException,
  UnauthorizedException,
  BadCredentialsException,
  BadRequestException,
  errorHandler,
};
