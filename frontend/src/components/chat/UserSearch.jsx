import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSocket } from '../../contexts/SocketContext';
import UserStatus from './UserStatus';
import api from '../../services/api';

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const SearchInput = styled.input`
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  &::placeholder {
    color: #6c757d;
  }
  
  @media (max-width: 768px) {
    padding: 14px;
    font-size: 16px; /* Prevents zoom on iOS */
  }
`;

const SearchButton = styled.button`
  padding: 12px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const UserResult = styled.div`
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f8f9fa;
    border-color: #007bff;
  }
`;

const Username = styled.div`
  font-weight: 600;
  color: #495057;
  margin-bottom: 4px;
`;

const UserId = styled.div`
  font-size: 12px;
  color: #6c757d;
`;

const UserStatusContainer = styled.div`
  margin-top: 4px;
`;

const Message = styled.div`
  padding: 12px;
  text-align: center;
  color: ${props => props.error ? '#dc3545' : '#6c757d'};
  font-size: 14px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  
  &::after {
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

const UserSearch = ({ onUserSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const { connected, userStatuses, getUserStatus } = useSocket();

  // Request status for search results when they change
  useEffect(() => {
    if (searchResults.length > 0 && connected) {
      const userIds = searchResults.map(user => user._id);
      getUserStatus(userIds);
    }
  }, [searchResults, connected, getUserStatus]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a user ID to search');
      setSearchResults([]);
      setMessage('');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setSearchResults([]);

    try {
      const response = await api.get(`/users/search/${encodeURIComponent(searchQuery.trim())}`);
      
      if (response.data.success && response.data.user) {
        setSearchResults([response.data.user]);
        setMessage('');
      } else {
        setSearchResults([]);
        setMessage('User not found');
      }
    } catch (err) {
      setSearchResults([]);
      if (err.response?.status === 404) {
        setMessage('User not found');
      } else {
        setError(err.response?.data?.error?.message || 'Search failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (user) => {
    try {
      // Create or get existing chat with this user using MongoDB ObjectId
      const response = await api.get(`/chats/with/${user._id}`);
      
      if (response.data.success) {
        onUserSelect(user, response.data.chat._id);
      }
    } catch (err) {
      console.error('Chat creation error:', err);
      setError('Failed to start chat. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <SearchContainer>
      <SearchInput
        type="text"
        placeholder="Enter user ID to search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={loading}
      />
      
      <SearchButton 
        onClick={handleSearch}
        disabled={loading || !searchQuery.trim()}
      >
        {loading ? 'Searching...' : 'Search User'}
      </SearchButton>

      {loading && <LoadingSpinner />}
      
      {error && <Message error>{error}</Message>}
      {message && <Message>{message}</Message>}

      <ResultsContainer>
        {searchResults.map((user) => {
          const userStatus = userStatuses[user._id] || { isOnline: false };
          
          return (
            <UserResult 
              key={user.uniqueUserId} 
              onClick={() => handleUserClick(user)}
            >
              <Username>{user.username}</Username>
              <UserId>ID: {user.uniqueUserId}</UserId>
              {connected && (
                <UserStatusContainer>
                  <UserStatus 
                    isOnline={userStatus.isOnline} 
                    lastSeen={userStatus.lastActive || user.lastActive}
                    showText={true}
                  />
                </UserStatusContainer>
              )}
            </UserResult>
          );
        })}
      </ResultsContainer>
    </SearchContainer>
  );
};

export default UserSearch;