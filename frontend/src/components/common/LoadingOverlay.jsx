import React from 'react';
import styled, { keyframes } from 'styled-components';
import LoadingSpinner from './LoadingSpinner';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${fadeIn} 0.2s ease-out;
`;

const LoadingCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-align: center;
  min-width: 200px;
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  color: #666;
  font-size: 16px;
`;

const LoadingOverlay = ({ isVisible, message = 'Loading...' }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Overlay>
      <LoadingCard>
        <LoadingSpinner size="large" showText={false} />
        <LoadingText>{message}</LoadingText>
      </LoadingCard>
    </Overlay>
  );
};

export default LoadingOverlay;