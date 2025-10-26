import React from 'react';
import styled from 'styled-components';

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.isOnline ? '#28a745' : '#6c757d'};
  border: 1px solid white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
`;

const StatusText = styled.span`
  font-size: 11px;
  color: #6c757d;
  font-weight: 500;
`;

const UserStatus = ({ isOnline, lastSeen, showText = true }) => {
  const getLastSeenText = () => {
    if (isOnline) return 'Online';
    
    if (!lastSeen) return 'Offline';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  return (
    <StatusContainer>
      <StatusDot isOnline={isOnline} />
      {showText && <StatusText>{getLastSeenText()}</StatusText>}
    </StatusContainer>
  );
};

export default UserStatus;