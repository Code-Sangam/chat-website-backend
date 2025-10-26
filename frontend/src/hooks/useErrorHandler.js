import { useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

export const useErrorHandler = () => {
  const { handleApiError, showError } = useNotification();
  const { signout } = useAuth();

  const handleError = useCallback((error, options = {}) => {
    const {
      defaultMessage = 'An error occurred',
      showNotification = true,
      logError = true,
      handleAuthErrors = true
    } = options;

    // Log error for debugging
    if (logError) {
      console.error('Error handled:', error);
    }

    // Handle authentication errors
    if (handleAuthErrors && error.response?.status === 401) {
      // Token expired or invalid
      signout();
      if (showNotification) {
        showError('Your session has expired. Please sign in again.');
      }
      return;
    }

    // Handle network errors
    if (!error.response && error.request) {
      if (showNotification) {
        showError('Network error. Please check your connection and try again.');
      }
      return;
    }

    // Handle other API errors
    if (showNotification) {
      handleApiError(error, defaultMessage);
    }
  }, [handleApiError, showError, signout]);

  const handleAsyncError = useCallback((asyncFn, options = {}) => {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        handleError(error, options);
        throw error; // Re-throw so calling code can handle it if needed
      }
    };
  }, [handleError]);

  const withErrorHandling = useCallback((fn, options = {}) => {
    return (...args) => {
      try {
        const result = fn(...args);
        
        // If the function returns a promise, handle async errors
        if (result && typeof result.then === 'function') {
          return result.catch(error => {
            handleError(error, options);
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        handleError(error, options);
        throw error;
      }
    };
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    withErrorHandling
  };
};