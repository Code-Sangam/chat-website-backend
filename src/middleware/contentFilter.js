// Content filtering and moderation middleware

// Profanity filter (basic implementation)
const profanityWords = [
  // Add profanity words here - keeping it minimal for demo
  'badword1', 'badword2', 'spam'
];

// Content moderation rules
const moderationRules = {
  maxRepeatedChars: 5,
  maxConsecutiveMessages: 10,
  maxUrlsPerMessage: 2,
  bannedDomains: ['malicious-site.com', 'spam-domain.com']
};

// Filter profanity from text
const filterProfanity = (text) => {
  let filteredText = text;
  
  profanityWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  
  return filteredText;
};

// Check for spam patterns
const detectSpam = (text) => {
  const spamIndicators = [];
  
  // Check for excessive repeated characters
  const repeatedCharsRegex = /(.)\1{5,}/g;
  if (repeatedCharsRegex.test(text)) {
    spamIndicators.push('excessive_repeated_characters');
  }
  
  // Check for excessive capitalization
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 10) {
    spamIndicators.push('excessive_capitalization');
  }
  
  // Check for multiple URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex) || [];
  if (urls.length > moderationRules.maxUrlsPerMessage) {
    spamIndicators.push('excessive_urls');
  }
  
  // Check for banned domains
  urls.forEach(url => {
    moderationRules.bannedDomains.forEach(domain => {
      if (url.includes(domain)) {
        spamIndicators.push('banned_domain');
      }
    });
  });
  
  return spamIndicators;
};

// Content moderation middleware
const moderateContent = (req, res, next) => {
  if (req.body && req.body.content) {
    const content = req.body.content;
    
    // Check for spam
    const spamIndicators = detectSpam(content);
    if (spamIndicators.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONTENT_MODERATION_FAILED',
          message: 'Message content violates community guidelines',
          details: spamIndicators
        }
      });
    }
    
    // Filter profanity (optional - you might want to reject instead)
    req.body.content = filterProfanity(content);
  }
  
  next();
};

// Rate limiting for user messages (prevent flooding)
const messageFloodProtection = new Map();

const floodProtection = (req, res, next) => {
  const userId = req.userId;
  const now = Date.now();
  const timeWindow = 60 * 1000; // 1 minute
  const maxMessages = 30; // 30 messages per minute
  
  if (!messageFloodProtection.has(userId)) {
    messageFloodProtection.set(userId, []);
  }
  
  const userMessages = messageFloodProtection.get(userId);
  
  // Remove old messages outside time window
  const recentMessages = userMessages.filter(timestamp => now - timestamp < timeWindow);
  
  if (recentMessages.length >= maxMessages) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'MESSAGE_FLOOD_PROTECTION',
        message: 'Too many messages sent. Please slow down.'
      }
    });
  }
  
  // Add current message timestamp
  recentMessages.push(now);
  messageFloodProtection.set(userId, recentMessages);
  
  next();
};

// Clean up old flood protection data periodically
setInterval(() => {
  const now = Date.now();
  const timeWindow = 60 * 1000;
  
  for (const [userId, timestamps] of messageFloodProtection.entries()) {
    const recentMessages = timestamps.filter(timestamp => now - timestamp < timeWindow);
    
    if (recentMessages.length === 0) {
      messageFloodProtection.delete(userId);
    } else {
      messageFloodProtection.set(userId, recentMessages);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Image content validation (basic)
const validateImageContent = (req, res, next) => {
  if (req.body && req.body.messageType === 'image') {
    // Basic image validation
    if (!req.body.imageUrl && !req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IMAGE',
          message: 'Image URL or file is required for image messages'
        }
      });
    }
    
    // Validate image URL format if provided
    if (req.body.imageUrl) {
      const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
      if (!urlRegex.test(req.body.imageUrl)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_IMAGE_URL',
            message: 'Invalid image URL format'
          }
        });
      }
    }
  }
  
  next();
};

// File content validation
const validateFileContent = (req, res, next) => {
  if (req.body && req.body.messageType === 'file') {
    const allowedFileTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    if (req.file) {
      if (!allowedFileTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'File type not allowed'
          }
        });
      }
      
      if (req.file.size > maxFileSize) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds maximum allowed size'
          }
        });
      }
    }
  }
  
  next();
};

module.exports = {
  moderateContent,
  floodProtection,
  validateImageContent,
  validateFileContent,
  filterProfanity,
  detectSpam
};