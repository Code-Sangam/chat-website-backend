const request = require('supertest');
const app = require('./src/app');

// Set test environment
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key'
process.env.MONGODB_URI = 'mongodb://localhost:27017/chat-website-test'
process.env.JWT_EXPIRES_IN = '7d'

const mongoose = require('mongoose');

const testSignup = async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI);
  
  const validUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123'
  };

  try {
    const response = await request(app)
      .post('/api/auth/signup')
      .send(validUserData);

    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(response.body, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await mongoose.connection.close();
  process.exit(0);
};

testSignup();