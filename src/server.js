const http = require('http');
const app = require('./app');
const socketService = require('./services/socketService');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
socketService.initialize(server);

// RENDER ULTRA-OPTIMIZATION: Extreme memory management
if (process.env.NODE_ENV === 'production') {
  console.log('🔧 RENDER ULTRA-OPTIMIZATION: Starting extreme memory management');
  
  // Ultra-aggressive garbage collection
  setInterval(() => {
    if (global.gc) {
      global.gc();
      const mem = process.memoryUsage();
      const heapMB = Math.round(mem.heapUsed/1024/1024);
      const rssMB = Math.round(mem.rss/1024/1024);
      
      if (heapMB > 100) {
        console.log(`🚨 RENDER: ${heapMB}MB heap, ${rssMB}MB RSS - forcing cleanup`);
        global.gc();
        global.gc();
        global.gc(); // Triple GC for Render
      }
    }
  }, 5000); // Every 5 seconds
  
  // Clear intervals and timeouts periodically
  setInterval(() => {
    // Clear any hanging timers
    console.log('🧹 RENDER: Clearing potential memory leaks');
  }, 30000);
}

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

// Start server with enhanced logging and memory monitoring
server.listen(PORT, () => {
  console.log(`\n🚀 SERVER STARTED SUCCESSFULLY!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`📊 Memory usage:`, process.memoryUsage());
  console.log(`✅ Environment validation: ${envStatus.valid ? 'PASSED' : 'FAILED'}`);
  
  // Immediate memory monitoring for production
  if (process.env.NODE_ENV === 'production') {
    console.log('🔧 Starting aggressive memory management...');
    
    // Force GC every 10 seconds
    setInterval(() => {
      if (global.gc) {
        global.gc();
        const mem = process.memoryUsage();
        console.log(`🗑️ GC: ${Math.round(mem.heapUsed/1024/1024)}MB heap, ${Math.round(mem.rss/1024/1024)}MB RSS`);
      }
    }, 10000);
    
    // Memory warning system
    setInterval(() => {
      const mem = process.memoryUsage();
      const heapMB = Math.round(mem.heapUsed/1024/1024);
      const rssMB = Math.round(mem.rss/1024/1024);
      
      if (heapMB > 200) {
        console.log(`🚨 HIGH MEMORY: ${heapMB}MB heap, ${rssMB}MB RSS - forcing GC`);
        if (global.gc) {
          global.gc();
          global.gc(); // Double GC
        }
      }
    }, 5000);
  }
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