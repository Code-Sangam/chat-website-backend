import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';
import { tokenManager } from '../utils/tokenManager';

const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  loading: true,
  isAuthenticated: false,
  user: null,
  token: null,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenManager.getToken();
      
      if (token) {
        // Check if token is expired
        if (tokenManager.isTokenExpired()) {
          console.log('Token expired, clearing auth data');
          tokenManager.clearAuthData();
          dispatch({
            type: 'AUTH_FAILURE',
            payload: 'Session expired. Please sign in again.'
          });
          return;
        }

        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authService.verifyToken();
          
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: response.data.user,
              token
            }
          });
        } catch (error) {
          console.error('Token verification failed:', error);
          tokenManager.clearAuthData();
          dispatch({
            type: 'AUTH_FAILURE',
            payload: 'Session expired. Please sign in again.'
          });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    checkAuth();
  }, []);

  // Sign up
  const signup = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.signup(userData);
      
      tokenManager.setToken(response.data.token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed';
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      });
      throw error;
    }
  };

  // Sign in
  const signin = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.signin(credentials);
      
      tokenManager.setToken(response.data.token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      });
      throw error;
    }
  };

  // Sign out
  const signout = async () => {
    try {
      await authService.signout();
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      tokenManager.clearAuthData();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.user
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Profile update failed';
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      });
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    signup,
    signin,
    signout,
    updateProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};