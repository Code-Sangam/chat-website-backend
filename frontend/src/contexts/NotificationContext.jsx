import React, { createContext, useContext, useReducer, useCallback } from 'react';

const NotificationContext = createContext();

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Notification reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
    
    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: []
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  notifications: []
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Add notification
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: NOTIFICATION_TYPES.INFO,
      duration: 5000, // Default 5 seconds
      ...notification
    };

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: newNotification
    });

    // Auto-remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        dispatch({
          type: 'REMOVE_NOTIFICATION',
          payload: id
        });
      }, newNotification.duration);
    }

    return id;
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    dispatch({
      type: 'REMOVE_NOTIFICATION',
      payload: id
    });
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      message,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      message,
      duration: 8000, // Errors stay longer
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      message,
      duration: 6000,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      message,
      ...options
    });
  }, [addNotification]);

  // Handle API errors with user-friendly messages
  const handleApiError = useCallback((error, defaultMessage = 'An error occurred') => {
    let message = defaultMessage;
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (data?.error?.message) {
        message = data.error.message;
      } else if (data?.message) {
        message = data.message;
      } else {
        // Generic messages based on status code
        switch (status) {
          case 400:
            message = 'Invalid request. Please check your input.';
            break;
          case 401:
            message = 'Authentication required. Please sign in again.';
            break;
          case 403:
            message = 'You do not have permission to perform this action.';
            break;
          case 404:
            message = 'The requested resource was not found.';
            break;
          case 429:
            message = 'Too many requests. Please try again later.';
            break;
          case 500:
            message = 'Server error. Please try again later.';
            break;
          default:
            message = `Request failed with status ${status}`;
        }
      }
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your connection and try again.';
    } else {
      // Other error
      message = error.message || defaultMessage;
    }

    return showError(message);
  }, [showError]);

  const value = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    handleApiError
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};