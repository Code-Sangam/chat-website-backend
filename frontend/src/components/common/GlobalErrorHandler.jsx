import { useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const GlobalErrorHandler = () => {
  const { showError, showWarning } = useNotification();
  const { signout } = useAuth();

  useEffect(() => {
    // Handle auth errors from API interceptor
    const handleAuthError = (event) => {
      const { message } = event.detail;
      showError(message);
      signout();
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Don't show notification for auth errors (already handled)
      if (event.reason?.response?.status === 401) {
        return;
      }
      
      showError('An unexpected error occurred. Please try again.');
    };

    // Handle JavaScript errors
    const handleError = (event) => {
      console.error('JavaScript error:', event.error);
      
      // Don't show notifications for minor errors
      if (event.error?.name === 'ChunkLoadError') {
        showWarning('Application update detected. Please refresh the page.');
        return;
      }
      
      // Only show error notification in development or for critical errors
      if (import.meta.env.DEV || event.error?.critical) {
        showError('An unexpected error occurred. Please refresh the page.');
      }
    };

    // Add event listeners
    window.addEventListener('auth-error', handleAuthError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [showError, showWarning, signout]);

  return null; // This component doesn't render anything
};

export default GlobalErrorHandler;