import React, { useEffect } from 'react';
import styled from 'styled-components';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useSocket } from '../../contexts/SocketContext';
import { useChat } from '../../hooks/useChat';

const WindowContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #ffffff;
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const BackButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  margin-right: 12px;
  
  &:hover {
    background-color: #e3f2fd;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  @media (max-width: 768px) {
    display: ${props => props.show ? 'flex' : 'none'};
    align-items: center;
    justify-content: center;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const Username = styled.h3`
  margin: 0;
  color: #495057;
  font-size: 1.2rem;
  font-weight: 600;
`;

const UserId = styled.span`
  color: #6c757d;
  font-size: 0.9rem;
`;

const OnlineStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: ${props => props.isOnline ? '#28a745' : '#6c757d'};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.isOnline ? '#28a745' : '#6c757d'};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const InputContainer = styled.div`
  border-top: 1px solid #e9ecef;
  background-color: #ffffff;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  text-align: center;
  padding: 40px;
`;

const EmptyTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 1.5rem;
  font-weight: 600;
`;

const EmptyMessage = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
`;

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  &::before {
    content: '';
    width: 20px;
    height: 20px;
    border: 2px solid #e9ecef;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  padding: 20px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  margin: 20px;
  text-align: center;
`;

const ChatWindow = ({ selectedUser, chatId, onBackClick, showBackButton }) => {
  const { 
    userStatuses,
    getUserStatus,
    connected
  } = useSocket();
  
  const {
    messages,
    loading,
    error,
    sendMessage: handleSendMessage
  } = useChat(chatId, selectedUser);

  // Get user status when user is selected
  useEffect(() => {
    if (selectedUser?.uniqueUserId && connected) {
      getUserStatus([selectedUser.uniqueUserId]);
    }
  }, [selectedUser, connected, getUserStatus]);

  if (!selectedUser) {
    return (
      <WindowContainer>
        <EmptyState>
          <EmptyTitle>Welcome to Chat</EmptyTitle>
          <EmptyMessage>
            Search for a user by their unique ID to start a conversation.
          </EmptyMessage>
        </EmptyState>
      </WindowContainer>
    );
  }

  return (
    <WindowContainer>
      <Header>
        <HeaderContent>
          <BackButton show={showBackButton} onClick={onBackClick}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
            </svg>
          </BackButton>
          <UserInfo>
            <Username>{selectedUser.username}</Username>
            <UserId>ID: {selectedUser.uniqueUserId}</UserId>
            {connected && (
              <OnlineStatus isOnline={userStatuses[selectedUser.uniqueUserId]?.isOnline}>
                <StatusDot isOnline={userStatuses[selectedUser.uniqueUserId]?.isOnline} />
                {userStatuses[selectedUser.uniqueUserId]?.isOnline ? 'Online' : 'Offline'}
              </OnlineStatus>
            )}
          </UserInfo>
        </HeaderContent>
      </Header>
      
      <MessagesContainer>
        {loading ? (
          <LoadingContainer>
            <LoadingSpinner />
            Loading messages...
          </LoadingContainer>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <MessageList messages={messages} />
        )}
      </MessagesContainer>
      
      <InputContainer>
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={loading || !!error || !connected}
          chatId={chatId}
        />
      </InputContainer>
    </WindowContainer>
  );
};

export default ChatWindow;