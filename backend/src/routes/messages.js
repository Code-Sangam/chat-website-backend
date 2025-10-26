const express = require('express');
const {
  editMessage,
  deleteMessage
} = require('../controllers/chatController');
const auth = require('../middleware/auth');
const { param, body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation middleware
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
  
  handleValidationErrors
];

// PUT /api/messages/:messageId - Edit a message
router.put('/:messageId', auth, validateMessageId, validateMessageContent, editMessage);

// DELETE /api/messages/:messageId - Delete a message
router.delete('/:messageId', auth, validateMessageId, deleteMessage);

module.exports = router;