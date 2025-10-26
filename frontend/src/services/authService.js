import api from './api';

export const authService = {
  // User registration
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // User login
  signin: async (credentials) => {
    const response = await api.post('/auth/signin', credentials);
    return response.data;
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