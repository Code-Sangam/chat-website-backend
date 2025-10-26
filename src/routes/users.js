const express = require('express');
const { 
  searchUsers, 
  getUserProfile, 
  updateUserProfile 
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation for profile update
const validateProfileUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  handleValidationErrors
];

// GET /api/users/search/:userId - Search users by unique ID (protected)
router.get('/search/:userId', auth, searchLimiter, searchUsers);

// GET /api/users/profile - Get current user profile (protected)
router.get('/profile', auth, getUserProfile);

// PUT /api/users/profile - Update current user profile (protected)
router.put('/profile', auth, validateProfileUpdate, updateUserProfile);

module.exports = router;