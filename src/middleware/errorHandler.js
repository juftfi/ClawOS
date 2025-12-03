const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Web3/Blockchain specific error handler
const handleWeb3Error = (error) => {
    let message = error.message;
    let statusCode = 500;

    // Insufficient funds
    if (message.includes('insufficient funds')) {
        statusCode = 400;
        message = 'Insufficient funds for transaction';
    }
    // Invalid address
    else if (message.includes('invalid address')) {
        statusCode = 400;
        message = 'Invalid blockchain address provided';
    }
    // Gas estimation failed
    else if (message.includes('gas required exceeds')) {
        statusCode = 400;
        message = 'Transaction gas estimation failed';
    }
    // Nonce too low
    else if (message.includes('nonce too low')) {
        statusCode = 409;
        message = 'Transaction nonce conflict';
    }
    // Network error
    else if (message.includes('network') || message.includes('connection')) {
        statusCode = 503;
        message = 'Blockchain network connection error';
    }

    return new AppError(message, statusCode);
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    // Web3 errors
    if (err.message && (
        err.message.includes('web3') ||
        err.message.includes('ethereum') ||
        err.message.includes('transaction') ||
        err.message.includes('gas') ||
        err.message.includes('nonce')
    )) {
        error = handleWeb3Error(err);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new AppError(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new AppError(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new AppError(message, 401);
    }

    // Send error response
    res.status(error.statusCode || 500).json({
        success: false,
        error: {
            message: error.message || 'Internal server error',
            statusCode: error.statusCode || 500,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        },
        timestamp: new Date().toISOString()
    });
};

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};

module.exports = {
    AppError,
    asyncHandler,
    errorHandler,
    notFoundHandler,
    handleWeb3Error
};
