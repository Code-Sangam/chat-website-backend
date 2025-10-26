// Test setup file for Jest
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key'
process.env.MONGODB_URI = 'mongodb://localhost:27017/chat-website-test'
process.env.JWT_EXPIRES_IN = '7d'