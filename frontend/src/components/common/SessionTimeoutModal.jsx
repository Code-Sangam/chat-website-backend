import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  max-width: 400px;
  width: 90%;
  text-align: center;
`;

const ModalTitle = styled.h3`
  color: #dc3545;
  margin-bottom: 1rem;
  font-size: 1.25rem;
`;

const ModalMessage = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const CountdownText = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #dc3545;
  margin-bottom: 1.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
`;

const PrimaryButton = styled(Button)`
  background-color: #007bff;
  color: white;

  &:hover {
    background-color: #0056b3;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #6c757d;
  color: white;

  &:hover {
    background-color: #545b62;
  }
`;

const SessionTimeoutModal = ({ 
  isOpen, 
  onExtend, 
  onLogout, 
  timeRemaining 
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(timeRemaining / 1000));

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil(timeRemaining / 1000);
      setCountdown(remaining);

      if (remaining <= 0) {
        onLogout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeRemaining, onLogout]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalTitle>Session Timeout Warning</ModalTitle>
        
        <ModalMessage>
          Your session will expire due to inactivity. You will be automatically 
          logged out unless you choose to extend your session.
        </ModalMessage>

        <CountdownText>
          Time remaining: {formatTime(countdown)}
        </CountdownText>

        <ButtonGroup>
          <PrimaryButton onClick={onExtend}>
            Extend Session
          </PrimaryButton>
          <SecondaryButton onClick={onLogout}>
            Logout Now
          </SecondaryButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SessionTimeoutModal;