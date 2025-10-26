import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

export const useSessionTimeout = (onWarning, onTimeout) => {
  const { isAuthenticated, signout } = useAuth();
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    if (!isAuthenticated) return;

    // Set warning timeout
    warningRef.current = setTimeout(() => {
      if (onWarning) {
        onWarning();
      }
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      signout();
      if (onTimeout) {
        onTimeout();
      }
    }, INACTIVITY_TIMEOUT);
  }, [isAuthenticated, signout, onWarning, onTimeout]);

  const extendSession = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  const getTimeRemaining = useCallback(() => {
    const elapsed = Date.now() - lastActivityRef.current;
    const remaining = INACTIVITY_TIMEOUT - elapsed;
    return Math.max(0, remaining);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timeouts when not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
      return;
    }

    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [isAuthenticated, resetTimeout]);

  return {
    extendSession,
    getTimeRemaining
  };
};