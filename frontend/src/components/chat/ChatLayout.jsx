import React, { useState } from 'react';
import styled from 'styled-components';
import UserSearch from './UserSearch';
import ChatWindow from './ChatWindow';
import UserProfile from './UserProfile';
import SettingsModal from './SettingsModal';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f8f9fa;
  position: relative;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.div`
  width: 300px;
  background-color: #ffffff;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: 100%;
    height: ${props => props.showChat ? '0' : '100vh'};
    overflow: hidden;
    transition: height 0.3s ease;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const Title = styled.h2`
  margin: 0;
  color: #495057;
  font-size: 1.5rem;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
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
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  @media (max-width: 768px) {
    display: ${props => props.showChat ? 'flex' : 'none'};
    align-items: center;
    justify-content: center;
  }
`;

const SearchContainer = styled.div`
  padding: 20px;
  flex: 1;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    height: ${props => props.showChat ? '100vh' : '0'};
    overflow: hidden;
    transition: height 0.3s ease;
  }
`;

const ChatLayout = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleUserSelect = (user, chatId) => {
    setSelectedUser(user);
    setChatId(chatId);
    setShowChat(true); // Show chat on mobile
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedUser(null);
    setChatId(null);
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <LayoutContainer>
      <Sidebar showChat={showChat}>
        <Header>
          <Title>Chat</Title>
        </Header>
        <SearchContainer>
          <UserSearch onUserSelect={handleUserSelect} />
        </SearchContainer>
        <UserProfile onSettingsClick={handleSettingsClick} />
      </Sidebar>
      <MainContent showChat={showChat}>
        <ChatWindow 
          selectedUser={selectedUser} 
          chatId={chatId}
          onBackClick={handleBackToList}
          showBackButton={showChat}
        />
      </MainContent>
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={handleCloseSettings} 
      />
    </LayoutContainer>
  );
};

export default ChatLayout;