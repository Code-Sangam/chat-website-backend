const express = require('express');
const {
  getUserChats,
  getOrCreateChat,
  getChatById,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  searchChatMessages
} = require('../controllers/chatController');
const auth = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimiter');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation middleware
const validateChatId = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID format'),
  handleValidationErrors
];

const validateUserId = [
  param('otherUserId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  handleValidationErrors
];

const validateMessageId = [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID format'),
  handleValidationErrors
];

const validateMessageContent = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 1000 })
    .withMessage('Message content cannot exceed 1000 characters'),
  
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

const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer'),
  
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search term is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  handleValidationErrors
];

// GET /api/chats - Get all chats for current user
router.get('/', auth, validatePagination, getUserChats);

// GET /api/chats/with/:otherUserId - Get or create chat with another user
router.get('/with/:otherUserId', auth, validateUserId, getOrCreateChat);

// GET /api/chats/:chatId - Get chat by ID
router.get('/:chatId', auth, validateChatId, getChatById);

// GET /api/chats/:chatId/messages - Get messages for a chat
router.get('/:chatId/messages', auth, validateChatId, validatePagination, getChatMessages);

// POST /api/chats/:chatId/messages - Send message to a chat
router.post('/:chatId/messages', auth, messageLimiter, validateChatId, validateMessageContent, sendMessage);

// PUT /api/chats/:chatId/read - Mark messages as read
router.put('/:chatId/read', auth, validateChatId, [
  body('messageIds')
    .optional()
    .isArray()
    .withMessage('Message IDs must be an array'),
  
  body('messageIds.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid message ID format'),
  
  handleValidationErrors
], markMessagesAsRead);

// PUT /api/messages/:messageId - Edit a message
router.put('/messages/:messageId', auth, validateMessageId, [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 1000 })
    .withMessage('Message content cannot exceed 1000 characters'),
  
  handleValidationErrors
], editMessage);

// DELETE /api/messages/:messageId - Delete a message
router.delete('/messages/:messageId', auth, validateMessageId, deleteMessage);

// GET /api/chats/:chatId/search - Search messages in a chat
router.get('/:chatId/search', auth, validateChatId, validateSearch, searchChatMessages);

module.exports = router;