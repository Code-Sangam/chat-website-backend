const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Attempting MongoDB connection...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Missing');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0 // Disable mongoose buffering
    });

    if (process.env.NODE_ENV !== 'test') {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Connection state: ${conn.connection.readyState}`);
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('🔍 Error details:', error);
    
    // Don't exit immediately, allow server to start without DB
    console.log('⚠️ Server starting without database connection');
  }
};

module.exports = connectDB;