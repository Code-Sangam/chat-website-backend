import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useSocket } from '../../contexts/SocketContext';

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageBubble = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isOwn', 'isPending'].includes(prop)
})`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.isOwn ? '#007bff' : '#e9ecef'};
  color: ${props => props.isOwn ? '#ffffff' : '#495057'};
  position: relative;
  opacity: ${props => props.isPending ? 0.7 : 1};
  
  ${props => props.isPending && `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      right: -20px;
      width: 12px;
      height: 12px;
      border: 2px solid #007bff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: translateY(-50%) rotate(0deg); }
      100% { transform: translateY(-50%) rotate(360deg); }
    }
  `}
`;

const MessageContent = styled.div`
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
`;

const MessageMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  opacity: 0.8;
  margin-top: 4px;
`;

const SenderName = styled.span`
  font-weight: 600;
`;

const Timestamp = styled.span`
  font-weight: 400;
`;

const EmptyMessages = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  text-align: center;
  padding: 40px 20px;
`;

const EmptyTitle = styled.h4`
  margin: 0 0 8px 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const DateSeparator = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0 12px 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: #e9ecef;
  }
  
  span {
    padding: 0 16px;
    font-size: 12px;
    color: #6c757d;
    background-color: #ffffff;
    font-weight: 500;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin: 8px 0;
  background-color: #f8f9fa;
  border-radius: 18px;
  max-width: 200px;
  color: #6c757d;
  font-size: 14px;
`;

const TypingDots = styled.div`
  display: flex;
  gap: 4px;
  
  span {
    width: 6px;
    height: 6px;
    background-color: #6c757d;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
  
  @keyframes typing {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-10px);
      opacity: 1;
    }
  }
`;

const ConnectionStatus = styled.div.withConfig({
  shouldForwardProp: (prop) => !['connected'].includes(prop)
})`
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
  color: ${props => props.connected ? '#28a745' : '#dc3545'};
  background-color: ${props => props.connected ? '#d4edda' : '#f8d7da'};
  border: 1px solid ${props => props.connected ? '#c3e6cb' : '#f5c6cb'};
  border-radius: 4px;
  margin: 8px 16px;
`;

const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null);
  const { connected, typingUsers } = useSocket();

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  if (!messages || messages.length === 0) {
    return (
      <ListContainer>
        <EmptyMessages>
          <EmptyTitle>No messages yet</EmptyTitle>
          <EmptyText>
            Start the conversation by sending a message below.
          </EmptyText>
        </EmptyMessages>
      </ListContainer>
    );
  }

  // Get typing users for current chat
  const currentTypingUsers = Object.values(typingUsers).filter(user => 
    user.chatId && messages.length > 0 && user.chatId === messages[0]?.chatId
  );

  return (
    <ListContainer>
      {!connected && (
        <ConnectionStatus connected={false}>
          Disconnected - Messages may not be delivered
        </ConnectionStatus>
      )}
      
      {messages.map((message, index) => {
        const previousMessage = index > 0 ? messages[index - 1] : null;
        const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
        
        return (
          <React.Fragment key={message._id}>
            {showDateSeparator && (
              <DateSeparator>
                <span>{formatDate(message.timestamp)}</span>
              </DateSeparator>
            )}
            
            <MessageBubble isOwn={message.isOwn} isPending={message.isPending}>
              <MessageContent>{message.content}</MessageContent>
              <MessageMeta>
                {!message.isOwn && (
                  <SenderName>{message.sender?.username || 'Unknown'}</SenderName>
                )}
                <Timestamp>{formatTime(message.timestamp)}</Timestamp>
              </MessageMeta>
            </MessageBubble>
          </React.Fragment>
        );
      })}
      
      {/* Show typing indicators */}
      {currentTypingUsers.map(user => (
        <TypingIndicator key={user.username}>
          <span>{user.username} is typing</span>
          <TypingDots>
            <span></span>
            <span></span>
            <span></span>
          </TypingDots>
        </TypingIndicator>
      ))}
      
      <div ref={messagesEndRef} />
    </ListContainer>
  );
};

export default MessageList;