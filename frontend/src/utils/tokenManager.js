// Token management utilities

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

export const tokenManager = {
  // Get token from localStorage
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Set token in localStorage
  setToken: (token, expiresIn = null) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      
      if (expiresIn) {
        const expiryTime = Date.now() + (expiresIn * 1000);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  // Remove token from localStorage
  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // Check if token exists
  hasToken: () => {
    return !!tokenManager.getToken();
  },

  // Check if token is expired
  isTokenExpired: () => {
    try {
      const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiryTime) return false; // No expiry set, assume valid
      
      return Date.now() > parseInt(expiryTime);
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true; // Assume expired on error
    }
  },

  // Get time until token expires (in milliseconds)
  getTimeUntilExpiry: () => {
    try {
      const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiryTime) return null;
      
      const timeRemaining = parseInt(expiryTime) - Date.now();
      return Math.max(0, timeRemaining);
    } catch (error) {
      console.error('Error getting time until expiry:', error);
      return 0;
    }
  },

  // Decode JWT token (basic decode, no verification)
  decodeToken: (token = null) => {
    try {
      const tokenToUse = token || tokenManager.getToken();
      if (!tokenToUse) return null;

      const parts = tokenToUse.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  // Get user ID from token
  getUserIdFromToken: () => {
    try {
      const decoded = tokenManager.decodeToken();
      return decoded?.userId || null;
    } catch (error) {
      console.error('Error getting user ID from token:', error);
      return null;
    }
  },

  // Check if token will expire soon (within 5 minutes)
  willExpireSoon: () => {
    const timeUntilExpiry = tokenManager.getTimeUntilExpiry();
    if (timeUntilExpiry === null) return false;
    
    const fiveMinutes = 5 * 60 * 1000;
    return timeUntilExpiry < fiveMinutes;
  },

  // Clear all auth-related data
  clearAuthData: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('userEmail');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }
};