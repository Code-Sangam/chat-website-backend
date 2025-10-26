import React, { useState } from 'react';
import styled from 'styled-components';
import UserSearch from './UserSearch';
import ChatWindow from './ChatWindow';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f8f9fa;
`;

const Sidebar = styled.div`
  width: 300px;
  background-color: #ffffff;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background-color: #ffffff;
`;

const Title = styled.h2`
  margin: 0;
  color: #495057;
  font-size: 1.5rem;
  font-weight: 600;
`;

const SearchContainer = styled.div`
  padding: 20px;
  flex: 1;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ChatLayout = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatId, setChatId] = useState(null);

  const handleUserSelect = (user, chatId) => {
    setSelectedUser(user);
    setChatId(chatId);
  };

  return (
    <LayoutContainer>
      <Sidebar>
        <Header>
          <Title>Chat</Title>
        </Header>
        <SearchContainer>
          <UserSearch onUserSelect={handleUserSelect} />
        </SearchContainer>
      </Sidebar>
      <MainContent>
        <ChatWindow 
          selectedUser={selectedUser} 
          chatId={chatId}
        />
      </MainContent>
    </LayoutContainer>
  );
};

export default ChatLayout;