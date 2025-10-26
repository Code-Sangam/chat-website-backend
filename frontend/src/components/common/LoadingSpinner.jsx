import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: ${props => props.fullScreen ? '100vh' : '200px'};
  flex-direction: column;
  gap: 1rem;
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0;
`;

const LoadingSpinner = ({ 
  size = '40px', 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  return (
    <SpinnerContainer fullScreen={fullScreen}>
      <Spinner size={size} />
      {text && <LoadingText>{text}</LoadingText>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner;