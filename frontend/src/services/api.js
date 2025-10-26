import axios from 'axios';

// Create axios instance with enhanced CORS configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // Increased to 60 seconds for Render cold starts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: false, // Set to false for now to avoid CORS issues
  // Add retry configuration
  retry: 3,
  retryDelay: 1000
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

// Response interceptor to handle errors with retry logic
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // Handle timeouts and network errors with smart retry
    if ((error.code === 'ECONNABORTED' || !error.response || error.code === 'ERR_NETWORK') && config && !config.__isRetryRequest) {
      config.__retryCount = config.__retryCount || 0;
      
      if (config.__retryCount < (config.retry || 3)) {
        config.__retryCount++;
        config.__isRetryRequest = true;
        
        console.log(`Retrying request ${config.__retryCount}/${config.retry || 3}: ${config.method?.toUpperCase()} ${config.url}`);
        
        // For timeout errors, try warming the backend first
        if (error.code === 'ECONNABORTED' && config.__retryCount === 1) {
          console.log('🔥 Timeout detected - attempting to warm backend...');
          try {
            const { backendWarmer } = await import('../utils/backendWarmer');
            await backendWarmer.warmBackend();
          } catch (warmError) {
            console.warn('Backend warming failed:', warmError.message);
          }
        }
        
        // Progressive delay: 1s, 3s, 5s
        const delay = config.__retryCount * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return api(config);
      }
    }
    
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
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      error.isTimeoutError = true;
      error.message = 'Request timed out. The server may be restarting. Please wait a moment and try again.';
    }
    
    // Handle CORS errors specifically
    if (error.code === 'ERR_NETWORK' && !error.response) {
      error.isCORSError = true;
      error.message = 'Connection blocked. The server may be starting up. Please wait a moment and try again.';
    }
    
    // Add error metadata
    error.timestamp = new Date().toISOString();
    error.url = error.config?.url;
    error.method = error.config?.method?.toUpperCase();
    
    return Promise.reject(error);
  }
);

export default api;