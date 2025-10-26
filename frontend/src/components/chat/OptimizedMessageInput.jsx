import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useDebounce } from '../../hooks/useDebounce';
import { useRenderPerformance } from '../../hooks/usePerformanceMonitor';

const InputContainer = styled.div`
  padding: 16px;
  border-top: 1px solid #e1e5e9;
  background: white;
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
  min-height: 40px;
  max-height: 120px;
`;

const MessageTextArea = styled.textarea`
  width: 100%;
  min-height: 40px;
  max-height: 120px;
  padding: 10px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 20px;
  font-size: 16px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
  overflow-y: auto;
  line-height: 1.4;

  &:focus {
    border-color: #007bff;
  }

  &::placeholder {
    color: #999;
  }

  /* Hide scrollbar in webkit browsers */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
  }
`;

const SendButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: ${props => props.disabled ? '#ccc' : '#007bff'};
  color: white;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const CharacterCount = styled.div`
  position: absolute;
  bottom: -20px;
  right: 8px;
  font-size: 12px;
  color: ${props => props.isNearLimit ? '#dc3545' : '#666'};
`;

const TypingIndicator = styled.div`
  position: absolute;
  top: -24px;
  left: 16px;
  font-size: 12px;
  color: #666;
  font-style: italic;
`;

const MAX_LENGTH = 1000;
const TYPING_TIMEOUT = 1000; // Stop typing indicator after 1 second

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const OptimizedMessageInput = memo(({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = "Type a message...",
  className
}) => {
  useRenderPerformance('OptimizedMessageInput');
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textAreaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Debounce typing indicator
  const debouncedMessage = useDebounce(message, 300);

  // Auto-resize textarea
  const adjustTextAreaHeight = useCallback(() => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.style.height = 'auto';
      textArea.style.height = `${Math.min(textArea.scrollHeight, 120)}px`;
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    
    if (value.length <= MAX_LENGTH) {
      setMessage(value);
      
      // Handle typing indicator
      if (value.trim() && !isTyping) {
        setIsTyping(true);
        onTypingStart?.();
      }
      
      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingStop?.();
      }, TYPING_TIMEOUT);
    }
  }, [isTyping, onTypingStart, onTypingStop]);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [message]);

  // Handle send message
  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      setIsTyping(false);
      onTypingStop?.();
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Reset textarea height
      setTimeout(() => {
        adjustTextAreaHeight();
      }, 0);
    }
  }, [message, disabled, onSendMessage, onTypingStop, adjustTextAreaHeight]);

  // Adjust height when message changes
  useEffect(() => {
    adjustTextAreaHeight();
  }, [message, adjustTextAreaHeight]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const canSend = message.trim().length > 0 && !disabled;
  const isNearLimit = message.length > MAX_LENGTH * 0.8;

  return (
    <InputContainer className={className}>
      <InputWrapper>
        <TextAreaWrapper>
          <MessageTextArea
            ref={textAreaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={MAX_LENGTH}
            rows={1}
          />
          
          {message.length > MAX_LENGTH * 0.7 && (
            <CharacterCount isNearLimit={isNearLimit}>
              {message.length}/{MAX_LENGTH}
            </CharacterCount>
          )}
        </TextAreaWrapper>
        
        <SendButton
          onClick={handleSend}
          disabled={!canSend}
          title="Send message"
        >
          <SendIcon />
        </SendButton>
      </InputWrapper>
    </InputContainer>
  );
});

OptimizedMessageInput.displayName = 'OptimizedMessageInput';

export default OptimizedMessageInput;