require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');

const app = express();

// Trust proxy for Render deployment (fixes rate limiter issues)
app.set('trust proxy', 1);

// 🚨 RENDER-OPTIMIZED CORS CONFIGURATION
console.log('🚀 Railway CORS: Optimized for Railway with Socket.io support');

// Railway-friendly CORS configuration
const corsOptions = {
  origin: [
    'https://chat-website-frontend-e3an3wwht-manualuser206-8672s-projects.vercel.app',
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Connect to database (skip in tests as tests handle their own connections)
if (process.env.NODE_ENV !== 'test') {
  console.log('🚀 Starting database connection...');
  connectDB().catch(error => {
    console.error('💥 Database connection failed during startup:', error.message);
  });
}

// Import security middleware
const { 
  sanitizeInput, 
  requestSizeLimiter, 
  requestLogger, 
  securityHeaders 
} = require('./middleware/security');

// RENDER OPTIMIZATION: Remove ALL heavy middleware
console.log('⚠️ All security middleware disabled for Render memory optimization');

// RENDER OPTIMIZATION: Remove all non-essential middleware
console.log('⚠️ Security headers, logging, and size limiting disabled for Render optimization');

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// RENDER OPTIMIZATION: Disable ALL memory-heavy middleware
console.log('🔧 RENDER OPTIMIZATION: Disabling memory-heavy middleware for Render free tier');

// RENDER OPTIMIZATION: All middleware disabled
console.log('⚠️ Input sanitization disabled for Render memory optimization');

// Health check endpoint with detailed diagnostics
app.get('/health', async (req, res) => {
  console.log('🏥 Health check requested');
  
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const healthData = {
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStates[dbStatus] || 'unknown',
        readyState: dbStatus
      },
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    console.log('✅ Health check successful:', healthData);
    res.json(healthData);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `API endpoint ${req.method} ${req.originalUrl} not found`
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      }
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format'
      }
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_FIELD',
        message: `${field} already exists`
      }
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token expired'
      }
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : error.message
    }
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;