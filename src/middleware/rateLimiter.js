const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
  },
});

// Auth routes rate limiter - Stricter limits for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again in 15 minutes.',
    });
  },
});

// Strict rate limiter for sensitive operations - 5 requests per hour
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour
  message: {
    success: false,
    message: 'Too many requests for this operation, please try again later.',
  },
  handler: (req, res) => {
    logger.warn(`Strict rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again in an hour.',
    });
  },
});

// Create a custom rate limiter
const createRateLimiter = (windowMs, max, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
    },
    handler: (req, res) => {
      logger.warn(`Custom rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message,
      });
    },
  });
};

module.exports = {
  apiLimiter,
  authLimiter,
  strictLimiter,
  createRateLimiter,
};
