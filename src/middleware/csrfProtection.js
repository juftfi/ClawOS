const crypto = require('crypto');
const logger = require('../utils/logger');

// Store for CSRF tokens (in production, use Redis or similar)
const csrfTokens = new Map();

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (now - data.createdAt > 24 * 60 * 60 * 1000) { // 24 hours
      csrfTokens.delete(token);
    }
  }
}, 60 * 60 * 1000);

/**
 * Generate a CSRF token for the current session
 */
const generateCsrfToken = (sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(token, {
    sessionId,
    createdAt: Date.now(),
  });
  return token;
};

/**
 * Validate a CSRF token
 */
const validateCsrfToken = (token, sessionId) => {
  const data = csrfTokens.get(token);
  if (!data) {
    return false;
  }

  if (data.sessionId !== sessionId) {
    return false;
  }

  // Check if token is expired (24 hours)
  if (Date.now() - data.createdAt > 24 * 60 * 60 * 1000) {
    csrfTokens.delete(token);
    return false;
  }

  return true;
};

/**
 * Middleware to add CSRF token to response
 */
const csrfTokenMiddleware = (req, res, next) => {
  // Generate session ID if not exists
  if (!req.session) {
    req.session = {};
  }

  if (!req.session.id) {
    req.session.id = crypto.randomBytes(16).toString('hex');
  }

  // Generate CSRF token
  const csrfToken = generateCsrfToken(req.session.id);

  // Add token to response headers
  res.setHeader('X-CSRF-Token', csrfToken);

  // Add token to locals for templates
  res.locals.csrfToken = csrfToken;

  next();
};

/**
 * Middleware to verify CSRF token on state-changing requests
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF check for auth endpoints (they use their own security measures)
  if (req.path.startsWith('/api/auth/wallet')) {
    return next();
  }

  // Get CSRF token from header or body
  const token = req.headers['x-csrf-token'] || req.body?._csrf;

  if (!token) {
    logger.warn(`CSRF token missing for ${req.method} ${req.path} from IP ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing',
    });
  }

  // Get session ID
  const sessionId = req.session?.id || req.cookies?.session_id;

  if (!sessionId) {
    logger.warn(`Session ID missing for CSRF validation from IP ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'Invalid session',
    });
  }

  // Validate token
  if (!validateCsrfToken(token, sessionId)) {
    logger.warn(`Invalid CSRF token for ${req.method} ${req.path} from IP ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    });
  }

  next();
};

/**
 * Simplified CSRF protection for development
 * Only logs warnings instead of blocking requests
 */
const csrfProtectionDev = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body?._csrf;
  if (!token) {
    logger.warn(`[DEV MODE] CSRF token missing for ${req.method} ${req.path}`);
  }

  next();
};

module.exports = {
  csrfTokenMiddleware,
  csrfProtection,
  csrfProtectionDev,
  generateCsrfToken,
  validateCsrfToken,
};
