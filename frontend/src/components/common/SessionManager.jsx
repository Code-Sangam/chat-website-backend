import React, { useState, useCallback } from 'react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import SessionTimeoutModal from './SessionTimeoutModal';

const SessionManager = ({ children }) => {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const handleWarning = useCallback(() => {
    setShowTimeoutWarning(true);
  }, []);

  const handleTimeout = useCallback(() => {
    setShowTimeoutWarning(false);
    // User will be automatically logged out by the hook
  }, []);

  const { extendSession, getTimeRemaining } = useSessionTimeout(
    handleWarning,
    handleTimeout
  );

  const handleExtendSession = useCallback(() => {
    extendSession();
    setShowTimeoutWarning(false);
  }, [extendSession]);

  const handleLogoutNow = useCallback(() => {
    setShowTimeoutWarning(false);
    handleTimeout();
  }, [handleTimeout]);

  // Update time remaining when modal is shown
  React.useEffect(() => {
    if (showTimeoutWarning) {
      const updateTimeRemaining = () => {
        setTimeRemaining(getTimeRemaining());
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 1000);

      return () => clearInterval(interval);
    }
  }, [showTimeoutWarning, getTimeRemaining]);

  return (
    <>
      {children}
      <SessionTimeoutModal
        isOpen={showTimeoutWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogoutNow}
        timeRemaining={timeRemaining}
      />
    </>
  );
};

export default SessionManager;