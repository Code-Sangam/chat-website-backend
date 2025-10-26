const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Socket.io authentication middleware
const socketAuth = async (socket, next) => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Add user info to socket
    socket.userId = decoded.userId;
    socket.user = user;
    
    next();

  } catch (error) {
    console.error('Socket authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    
    return next(new Error('Authentication error: Failed to authenticate'));
  }
};

module.exports = socketAuth;