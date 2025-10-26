const http = require('http');
const app = require('./app');
const socketService = require('./services/socketService');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
socketService.initialize(server);

// Check environment variables before starting
const EnvironmentChecker = require('./utils/envChecker');
const envChecker = new EnvironmentChecker();
const envStatus = envChecker.checkEnvironment();

if (!envStatus.valid) {
  console.log('\n🚨 ENVIRONMENT VALIDATION FAILED!');
  console.log('Server may not function properly with missing/invalid environment variables.');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('❌ Exiting due to environment issues in production.');
    process.exit(1);
  } else {
    console.log('⚠️ Continuing in development mode despite environment issues.');
  }
}

// Start server with enhanced logging
server.listen(PORT, () => {
  console.log(`\n🚀 SERVER STARTED SUCCESSFULLY!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`📊 Memory usage:`, process.memoryUsage());
  console.log(`✅ Environment validation: ${envStatus.valid ? 'PASSED' : 'FAILED'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});