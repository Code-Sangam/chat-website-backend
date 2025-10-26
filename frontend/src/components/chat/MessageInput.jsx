import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useSocket } from '../../contexts/SocketContext';

const InputContainer = styled.div`
  padding: 20px;
  background-color: #ffffff;
  border-top: 1px solid #e9ecef;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  max-width: 100%;
`;

const TextAreaWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 44px;
  max-height: 120px;
  padding: 12px 16px;
  border: 1px solid #ced4da;
  border-radius: 22px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  &::placeholder {
    color: #6c757d;
  }

  &:disabled {
    background-color: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background-color: #0056b3;
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const CharacterCount = styled.div`
  position: absolute;
  bottom: -20px;
  right: 0;
  font-size: 11px;
  color: ${props => props.isNearLimit ? '#dc3545' : '#6c757d'};
  font-weight: ${props => props.isNearLimit ? '600' : '400'};
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 12px;
  margin-top: 8px;
  padding: 0 16px;
`;

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const MessageInput = ({ onSendMessage, disabled = false, chatId }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textAreaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { startTyping, stopTyping, connected } = useSocket();

  const MAX_LENGTH = 1000;
  const NEAR_LIMIT_THRESHOLD = 50;

  const adjustTextAreaHeight = () => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.style.height = 'auto';
      textArea.style.height = `${Math.min(textArea.scrollHeight, 120)}px`;
    }
  };

  // Debounced typing indicator
  const handleTypingStart = useCallback(() => {
    if (!isTyping && chatId && connected) {
      setIsTyping(true);
      startTyping(chatId);
    }
  }, [isTyping, chatId, connected, startTyping]);

  const handleTypingStop = useCallback(() => {
    if (isTyping && chatId && connected) {
      setIsTyping(false);
      stopTyping(chatId);
    }
  }, [isTyping, chatId, connected, stopTyping]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    if (value.length <= MAX_LENGTH) {
      setMessage(value);
      setError('');
      
      // Handle typing indicators
      if (value.trim() && !isTyping) {
        handleTypingStart();
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      if (value.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          handleTypingStop();
        }, 2000); // Stop typing after 2 seconds of inactivity
      } else {
        handleTypingStop();
      }
      
      // Adjust height after state update
      setTimeout(adjustTextAreaHeight, 0);
    } else {
      setError(`Message cannot exceed ${MAX_LENGTH} characters`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage) {
      setError('Please enter a message');
      return;
    }

    if (trimmedMessage.length > MAX_LENGTH) {
      setError(`Message cannot exceed ${MAX_LENGTH} characters`);
      return;
    }

    if (!connected) {
      setError('Not connected. Please check your connection.');
      return;
    }

    setIsSending(true);
    setError('');

    // Stop typing indicator
    handleTypingStop();
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      await onSendMessage(trimmedMessage);
      setMessage('');
      
      // Reset textarea height
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.style.height = 'auto';
        }
      }, 0);
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Cleanup typing timeout on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        handleTypingStop();
      }
    };
  }, [isTyping, handleTypingStop]);

  const isNearLimit = message.length >= MAX_LENGTH - NEAR_LIMIT_THRESHOLD;
  const canSend = message.trim() && !isSending && !disabled && message.length <= MAX_LENGTH && connected;

  return (
    <InputContainer>
      <InputWrapper>
        <TextAreaWrapper>
          <TextArea
            ref={textAreaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled || isSending}
            rows={1}
          />
          {message.length > 0 && (
            <CharacterCount isNearLimit={isNearLimit}>
              {message.length}/{MAX_LENGTH}
            </CharacterCount>
          )}
        </TextAreaWrapper>
        
        <SendButton
          onClick={handleSend}
          disabled={!canSend}
          title={isSending ? 'Sending...' : 'Send message'}
        >
          <SendIcon />
        </SendButton>
      </InputWrapper>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputContainer>
  );
};

export default MessageInput;