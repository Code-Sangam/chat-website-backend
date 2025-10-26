import api from './api';

// Retry helper function
const retryRequest = async (requestFn, maxRetries = 2, delay = 2000) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries || (error.response && error.response.status !== 500)) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

export const authService = {
  // User registration
  signup: async (userData) => {
    return retryRequest(async () => {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    });
  },

  // User login
  signin: async (credentials) => {
    return retryRequest(async () => {
      const response = await api.post('/auth/signin', credentials);
      return response.data;
    });
  },

  // User logout
  signout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Verify token
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  }
};