const { body, param, query, validationResult } = require('express-validator');
const validator = require('validator');

// Validation middleware to check for errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      }
    });
  }
  next();
};

// Enhanced user registration validation rules
const validateUserRegistration = [
  body('username')
    .trim()
    .escape() // Escape HTML entities
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom((value) => {
      // Check for reserved usernames
      const reservedNames = ['admin', 'root', 'system', 'api', 'www', 'mail', 'support'];
      if (reservedNames.includes(value.toLowerCase())) {
        throw new Error('Username is reserved and cannot be used');
      }
      return true;
    }),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    })
    .custom((value) => {
      // Additional email validation
      if (!validator.isEmail(value)) {
        throw new Error('Invalid email format');
      }
      
      // Check for disposable email domains (basic list)
      const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
      const domain = value.split('@')[1];
      if (disposableDomains.includes(domain)) {
        throw new Error('Disposable email addresses are not allowed');
      }
      
      return true;
    }),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
    .custom((value) => {
      // Check for common weak passwords
      const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
      if (commonPasswords.includes(value.toLowerCase())) {
        throw new Error('Password is too common and not secure');
      }
      
      // Check for sequential characters
      if (/123456|abcdef|qwerty/i.test(value)) {
        throw new Error('Password cannot contain sequential characters');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Enhanced user login validation rules
const validateUserLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    })
    .isLength({ max: 254 })
    .withMessage('Email address is too long'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password length is invalid'),
  
  handleValidationErrors
];

// Enhanced user search validation rules
const validateUserSearch = [
  param('userId')
    .trim()
    .escape()
    .isLength({ min: 1, max: 8 })
    .withMessage('Search term must be between 1 and 8 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Search term can only contain letters and numbers')
    .custom((value) => {
      // Prevent SQL injection patterns
      const sqlPatterns = /('|(\\)|(;)|(--)|(\|)|(\*)|(%)|(\+)|(=))/;
      if (sqlPatterns.test(value)) {
        throw new Error('Invalid characters in search term');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Message content validation
const validateMessageContent = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters')
    .custom((value) => {
      // Check for excessive whitespace
      if (value.replace(/\s/g, '').length === 0) {
        throw new Error('Message cannot be only whitespace');
      }
      
      // Check for spam patterns (basic)
      const spamPatterns = [
        /(.)\1{10,}/, // Repeated characters
        /https?:\/\/[^\s]+/gi, // URLs (if you want to block them)
      ];
      
      for (const pattern of spamPatterns) {
        if (pattern.test(value)) {
          throw new Error('Message content contains prohibited patterns');
        }
      }
      
      return true;
    }),
  
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file'])
    .withMessage('Invalid message type'),
  
  body('replyToId')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID format'),
  
  handleValidationErrors
];

// Chat ID validation
const validateChatId = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID format'),
  
  handleValidationErrors
];

// User ID validation
const validateUserId = [
  param('otherUserId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  handleValidationErrors
];

// Message ID validation
const validateMessageId = [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID format'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer')
    .toInt(),
  
  query('after')
    .optional()
    .isISO8601()
    .withMessage('After parameter must be a valid ISO 8601 date'),
  
  handleValidationErrors
];

// Search query validation
const validateSearchQuery = [
  query('q')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .custom((value) => {
      // Prevent injection attacks
      const dangerousPatterns = /(<script|javascript:|on\w+\s*=|<iframe|<object|<embed)/i;
      if (dangerousPatterns.test(value)) {
        throw new Error('Search query contains prohibited content');
      }
      return true;
    }),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('username')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom((value) => {
      if (value) {
        const reservedNames = ['admin', 'root', 'system', 'api', 'www', 'mail', 'support'];
        if (reservedNames.includes(value.toLowerCase())) {
          throw new Error('Username is reserved and cannot be used');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

// Read messages validation
const validateReadMessages = [
  body('messageIds')
    .optional()
    .isArray()
    .withMessage('Message IDs must be an array'),
  
  body('messageIds.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid message ID format'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateUserSearch,
  validateMessageContent,
  validateChatId,
  validateUserId,
  validateMessageId,
  validatePagination,
  validateSearchQuery,
  validateProfileUpdate,
  validateReadMessages,
  handleValidationErrors
};