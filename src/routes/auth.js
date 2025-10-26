const express = require('express');
const { 
  registerUser, 
  loginUser, 
  logoutUser, 
  verifyToken 
} = require('../controllers/authController');
const { 
  validateUserRegistration, 
  validateUserLogin 
} = require('../middleware/validation');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { 
  passwordLimiter, 
  accountCreationLimiter,
  sanitizeInput 
} = require('../middleware/security');

const router = express.Router();

// POST /api/auth/signup - User registration
router.post('/signup', 
  accountCreationLimiter,
  sanitizeInput,
  validateUserRegistration, 
  registerUser
);

// POST /api/auth/signin - User login
router.post('/signin', 
  authLimiter,
  passwordLimiter,
  sanitizeInput,
  validateUserLogin, 
  loginUser
);

// POST /api/auth/logout - User logout (protected)
router.post('/logout', auth, logoutUser);

// GET /api/auth/verify - Verify token (protected)
router.get('/verify', auth, verifyToken);

module.exports = router;