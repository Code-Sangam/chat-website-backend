import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useNotification, NOTIFICATION_TYPES } from '../../contexts/NotificationContext';

// Animations
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const Container = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  width: 100%;
  pointer-events: none;

  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
`;

const NotificationCard = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${slideIn} 0.3s ease-out;
  pointer-events: auto;
  position: relative;
  
  ${props => {
    switch (props.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return `
          background-color: #d4edda;
          border-left: 4px solid #28a745;
          color: #155724;
        `;
      case NOTIFICATION_TYPES.ERROR:
        return `
          background-color: #f8d7da;
          border-left: 4px solid #dc3545;
          color: #721c24;
        `;
      case NOTIFICATION_TYPES.WARNING:
        return `
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          color: #856404;
        `;
      case NOTIFICATION_TYPES.INFO:
      default:
        return `
          background-color: #d1ecf1;
          border-left: 4px solid #17a2b8;
          color: #0c5460;
        `;
    }
  }}

  &.removing {
    animation: ${slideOut} 0.3s ease-in;
  }
`;

const IconContainer = styled.div`
  margin-right: 12px;
  margin-top: 2px;
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
`;

const Message = styled.div`
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: ${props => props.hasTitle ? '4px' : '0'};
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
  margin-top: 2px;
  opacity: 0.7;
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 0 0 8px 8px;
  animation: progress ${props => props.duration}ms linear;

  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;

// Icon components
const getIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.SUCCESS:
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case NOTIFICATION_TYPES.ERROR:
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    case NOTIFICATION_TYPES.WARNING:
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    case NOTIFICATION_TYPES.INFO:
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
  }
};

const NotificationItem = ({ notification, onRemove }) => {
  const handleClose = () => {
    onRemove(notification.id);
  };

  return (
    <NotificationCard type={notification.type}>
      <IconContainer>
        {getIcon(notification.type)}
      </IconContainer>
      
      <Content>
        {notification.title && (
          <Title>{notification.title}</Title>
        )}
        <Message hasTitle={!!notification.title}>
          {notification.message}
        </Message>
      </Content>
      
      <CloseButton onClick={handleClose} aria-label="Close notification">
        ×
      </CloseButton>
      
      {notification.duration > 0 && (
        <ProgressBar duration={notification.duration} />
      )}
    </NotificationCard>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Container>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </Container>
  );
};

export default NotificationContainer;