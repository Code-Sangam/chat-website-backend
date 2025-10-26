// Test script to verify API endpoints
const axios = require('axios');

const API_BASE = 'https://chat-website-backend.onrender.com/api';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...');
    
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('https://chat-website-backend.onrender.com/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test user registration
    console.log('2. Testing user registration...');
    const signupResponse = await axios.post(`${API_BASE}/auth/signup`, {
      username: 'testuser' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'Password123!'
    });
    console.log('✅ User registration:', signupResponse.data.success);
    
    const token = signupResponse.data.data.token;
    const userId = signupResponse.data.data.user.id;
    
    // Test user search
    console.log('3. Testing user search...');
    const searchResponse = await axios.get(`${API_BASE}/users/search/TESTUSER`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ User search:', searchResponse.data.success);
    
    console.log('🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

testAPI();