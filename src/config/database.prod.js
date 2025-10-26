const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Production MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary',
      // Connection pool settings
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      // Monitoring settings
      heartbeatFrequencyMS: 10000,
      // Compression
      compressors: ['zlib'],
      zlibCompressionLevel: 6,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB shutdown:', err);
        process.exit(1);
      }
    });

    // Enable mongoose debugging in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      mongoose.set('debug', true);
    }

    return conn;

  } catch (error) {
    console.error('Database connection error:', error.message);
    
    // In production, attempt to reconnect after a delay
    if (process.env.NODE_ENV === 'production') {
      console.log('Attempting to reconnect in 5 seconds...');
      setTimeout(() => {
        connectDB();
      }, 5000);
    } else {
      process.exit(1);
    }
  }
};

// Database health check
const checkDatabaseHealth = async () => {
  try {
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.ping();
    return { healthy: true, latency: Date.now() };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

// Database metrics
const getDatabaseMetrics = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize,
      storageSize: stats.storageSize,
      connections: mongoose.connection.readyState,
    };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = {
  connectDB,
  checkDatabaseHealth,
  getDatabaseMetrics
};