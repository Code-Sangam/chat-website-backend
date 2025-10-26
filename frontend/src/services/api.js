import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // Increased to 30 seconds for Render free tier
  headers: {
    'Content-Type': 'application/json'
  }
});

import { tokenManager } from '../utils/tokenManager';

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token && !tokenManager.isTokenExpired()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.error?.code;
      
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
        tokenManager.clearAuthData();
        
        // Dispatch custom event for auth error
        window.dispatchEvent(new CustomEvent('auth-error', {
          detail: { message: 'Session expired. Please sign in again.' }
        }));
        
        // Redirect to signin page
        setTimeout(() => {
          window.location.href = '/signin';
        }, 100);
      }
    }
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      error.retryAfter = retryAfter ? parseInt(retryAfter) : 60;
    }
    
    // Handle network errors
    if (!error.response && error.request) {
      error.isNetworkError = true;
      error.message = 'Network error. Please check your connection and try again.';
    }
    
    // Handle timeout errors with retry logic
    if (error.code === 'ECONNABORTED') {
      error.isTimeoutError = true;
      error.message = 'Request timed out. The server may be restarting. Please wait a moment and try again.';
    }
    
    // Add error metadata
    error.timestamp = new Date().toISOString();
    error.url = error.config?.url;
    error.method = error.config?.method?.toUpperCase();
    
    return Promise.reject(error);
  }
);

export default api;