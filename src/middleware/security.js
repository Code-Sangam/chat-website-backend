const rateLimit = require('express-rate-limit');

// Enhanced security middleware for sensitive operations
const createSecurityLimiter = (windowMs, max, message) => {
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next(); // Skip rate limiting in tests
  }
  
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'SECURITY_RATE_LIMIT',
        message
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests for auth endpoints
    skipSuccessfulRequests: true,
    // Custom key generator to include user agent for better tracking
    keyGenerator: (req) => {
      return `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
    }
  });
};

// Strict limiter for password-related operations
const passwordLimiter = createSecurityLimiter(
  15 * 60 * 1000, // 15 minutes
  3, // 3 attempts
  'Too many password attempts. Please try again in 15 minutes.'
);

// Limiter for account creation
const accountCreationLimiter = createSecurityLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 accounts per hour
  'Too many accounts created. Please try again in 1 hour.'
);

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove potential XSS characters from string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Request size limiter
const requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: {
        code: 'REQUEST_TOO_LARGE',
        message: 'Request payload too large'
      }
    });
  }

  next();
};

// IP whitelist middleware (for admin endpoints if needed)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Access denied from this IP address'
        }
      });
    }

    next();
  };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

module.exports = {
  passwordLimiter,
  accountCreationLimiter,
  sanitizeInput,
  requestSizeLimiter,
  ipWhitelist,
  requestLogger,
  securityHeaders
};