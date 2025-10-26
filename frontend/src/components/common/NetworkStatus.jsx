import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSocket } from '../../contexts/SocketContext';
import { useNotification } from '../../contexts/NotificationContext';

const slideDown = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const StatusBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9998;
  padding: 8px 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  animation: ${slideDown} 0.3s ease-out;
  
  ${props => {
    if (props.status === 'offline') {
      return `
        background-color: #dc3545;
        color: white;
      `;
    } else if (props.status === 'connecting') {
      return `
        background-color: #ffc107;
        color: #212529;
      `;
    } else if (props.status === 'reconnected') {
      return `
        background-color: #28a745;
        color: white;
      `;
    }
    return '';
  }}
`;

const StatusIcon = styled.span`
  margin-right: 8px;
`;

const RetryButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: inherit;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  const [statusType, setStatusType] = useState('online');
  const [wasOffline, setWasOffline] = useState(false);
  
  const { connected, connecting, error } = useSocket();
  const { showError, showSuccess } = useNotification();

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setStatusType('reconnected');
        setShowStatus(true);
        showSuccess('Connection restored');
        
        // Hide reconnected status after 3 seconds
        setTimeout(() => {
          setShowStatus(false);
          setWasOffline(false);
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setStatusType('offline');
      setShowStatus(true);
      showError('No internet connection', { duration: 0 }); // Persistent error
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, showError, showSuccess]);

  // Monitor socket connection status
  useEffect(() => {
    if (!isOnline) return; // Don't show socket status if offline

    if (connecting) {
      setStatusType('connecting');
      setShowStatus(true);
    } else if (!connected && error) {
      setStatusType('offline');
      setShowStatus(true);
      showError(`Connection error: ${error}`, { duration: 0 });
    } else if (connected && showStatus && statusType === 'connecting') {
      setStatusType('reconnected');
      showSuccess('Connected to chat server');
      
      // Hide reconnected status after 3 seconds
      setTimeout(() => {
        setShowStatus(false);
      }, 3000);
    }
  }, [connected, connecting, error, isOnline, showStatus, statusType, showError, showSuccess]);

  const handleRetry = () => {
    window.location.reload();
  };

  const getStatusMessage = () => {
    switch (statusType) {
      case 'offline':
        if (!isOnline) {
          return 'No internet connection';
        } else if (error) {
          return `Connection error: ${error}`;
        }
        return 'Connection lost';
      
      case 'connecting':
        return 'Connecting...';
      
      case 'reconnected':
        return 'Connection restored';
      
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (statusType) {
      case 'offline':
        return '⚠️';
      case 'connecting':
        return '🔄';
      case 'reconnected':
        return '✅';
      default:
        return '';
    }
  };

  if (!showStatus) {
    return null;
  }

  return (
    <StatusBar status={statusType}>
      <StatusIcon>{getStatusIcon()}</StatusIcon>
      {getStatusMessage()}
      
      {statusType === 'offline' && (
        <RetryButton onClick={handleRetry}>
          Retry
        </RetryButton>
      )}
    </StatusBar>
  );
};

export default NetworkStatus;