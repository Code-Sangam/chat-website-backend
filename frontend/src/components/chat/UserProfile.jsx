import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import UserStatus from './UserStatus';

const ProfileContainer = styled.div`
  padding: 16px;
  border-top: 1px solid #e9ecef;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const ProfilePicture = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  margin-right: 12px;
  cursor: pointer;
  position: relative;
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #495057;
  font-size: 14px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserId = styled.div`
  font-size: 12px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
`;

const SettingsButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f8f9fa;
    color: #495057;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const UserProfile = ({ onSettingsClick }) => {
  const { user } = useAuth();
  const { connected, userStatuses, getUserStatus } = useSocket();

  // Get current user's online status
  const currentUserStatus = userStatuses[user?._id] || { isOnline: connected };

  useEffect(() => {
    // Request status for current user when component mounts
    if (user?._id && connected) {
      getUserStatus([user._id]);
    }
  }, [user?._id, connected, getUserStatus]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <ProfileContainer>
      <UserInfo>
        <ProfilePicture>
          {getInitials(user?.username)}
        </ProfilePicture>
        <UserDetails>
          <UserName>{user?.username || 'User'}</UserName>
          <UserId>ID: {user?.uniqueUserId || 'N/A'}</UserId>
          <UserStatus 
            isOnline={currentUserStatus.isOnline} 
            lastSeen={user?.lastActive}
            showText={true}
          />
        </UserDetails>
      </UserInfo>
      <SettingsButton onClick={onSettingsClick} title="Settings">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
        </svg>
      </SettingsButton>
    </ProfileContainer>
  );
};

export default UserProfile;