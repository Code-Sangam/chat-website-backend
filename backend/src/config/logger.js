const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = path.dirname(process.env.LOG_FILE_PATH || './logs/app.log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\nStack: ${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'chat-website-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: []
});

// Production logging configuration
if (process.env.NODE_ENV === 'production') {
  // File transport for all logs
  logger.add(new winston.transports.File({
    filename: process.env.LOG_FILE_PATH || './logs/app.log',
    maxsize: 10485760, // 10MB
    maxFiles: 10,
    tailable: true
  }));

  // Separate error log file
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }));

  // Console output for production (minimal)
  logger.add(new winston.transports.Console({
    level: 'error',
    format: winston.format.simple()
  }));

} else if (process.env.NODE_ENV === 'staging') {
  // Staging logging (more verbose than production)
  logger.add(new winston.transports.File({
    filename: process.env.LOG_FILE_PATH || './logs/staging.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  }));

  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));

} else {
  // Development logging (console only)
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));

  // Optional file logging in development
  if (process.env.DEV_LOG_TO_FILE === 'true') {
    logger.add(new winston.transports.File({
      filename: './logs/development.log',
      maxsize: 1048576, // 1MB
      maxFiles: 2
    }));
  }
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.userId || 'anonymous'
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(logLevel, 'HTTP Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.userId || 'anonymous'
    });
  });

  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.userId || 'anonymous',
    body: req.body,
    params: req.params,
    query: req.query
  });

  next(error);
};

// Security event logging
const securityLogger = {
  logAuthAttempt: (email, success, ip, userAgent) => {
    logger.info('Authentication Attempt', {
      email,
      success,
      ip,
      userAgent,
      type: 'auth_attempt'
    });
  },

  logSuspiciousActivity: (activity, details, req) => {
    logger.warn('Suspicious Activity', {
      activity,
      details,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.userId || 'anonymous',
      url: req.originalUrl,
      type: 'security_event'
    });
  },

  logRateLimitExceeded: (ip, endpoint, userAgent) => {
    logger.warn('Rate Limit Exceeded', {
      ip,
      endpoint,
      userAgent,
      type: 'rate_limit'
    });
  },

  logUnauthorizedAccess: (resource, req) => {
    logger.warn('Unauthorized Access Attempt', {
      resource,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.userId || 'anonymous',
      url: req.originalUrl,
      type: 'unauthorized_access'
    });
  }
};

// Performance logging
const performanceLogger = {
  logSlowQuery: (query, duration, collection) => {
    logger.warn('Slow Database Query', {
      query: JSON.stringify(query),
      duration: `${duration}ms`,
      collection,
      type: 'performance'
    });
  },

  logHighMemoryUsage: (usage) => {
    logger.warn('High Memory Usage', {
      usage,
      type: 'performance'
    });
  },

  logHighCPUUsage: (usage) => {
    logger.warn('High CPU Usage', {
      usage,
      type: 'performance'
    });
  }
};

// WebSocket logging
const wsLogger = {
  logConnection: (userId, socketId) => {
    logger.info('WebSocket Connection', {
      userId,
      socketId,
      type: 'websocket'
    });
  },

  logDisconnection: (userId, socketId, reason) => {
    logger.info('WebSocket Disconnection', {
      userId,
      socketId,
      reason,
      type: 'websocket'
    });
  },

  logMessage: (fromUserId, toUserId, chatId, messageType) => {
    logger.info('WebSocket Message', {
      fromUserId,
      toUserId,
      chatId,
      messageType,
      type: 'websocket'
    });
  },

  logError: (error, userId, socketId) => {
    logger.error('WebSocket Error', {
      error: error.message,
      stack: error.stack,
      userId,
      socketId,
      type: 'websocket'
    });
  }
};

// Log rotation and cleanup
const setupLogRotation = () => {
  if (process.env.NODE_ENV === 'production') {
    // Clean up old log files (older than 30 days)
    const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    setInterval(() => {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      fs.readdir(logDir, (err, files) => {
        if (err) return;
        
        files.forEach(file => {
          const filePath = path.join(logDir, file);
          fs.stat(filePath, (err, stats) => {
            if (err) return;
            
            if (stats.mtime.getTime() < thirtyDaysAgo) {
              fs.unlink(filePath, (err) => {
                if (!err) {
                  logger.info('Old log file cleaned up', { file });
                }
              });
            }
          });
        });
      });
    }, cleanupInterval);
  }
};

// Initialize log rotation
setupLogRotation();

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  securityLogger,
  performanceLogger,
  wsLogger
};