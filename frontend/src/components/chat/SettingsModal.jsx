import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import UserStatus from './UserStatus';

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
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    width: 95%;
    max-height: 90vh;
    border-radius: 12px;
  }
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #495057;
  font-size: 1.25rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #f8f9fa;
    color: #495057;
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const LargeProfilePicture = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 36px;
  margin-bottom: 16px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.05);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    background-color: #28a745;
    border: 3px solid white;
    border-radius: 50%;
  }
`;

const ChangePhotoButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 8px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0056b3;
  }
`;

const InfoSection = styled.div`
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #495057;
`;

const InfoValue = styled.span`
  color: #6c757d;
  font-family: monospace;
`;

const EditButton = styled.button`
  background: none;
  border: 1px solid #007bff;
  color: #007bff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #007bff;
    color: white;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.variant === 'danger' ? `
    background-color: #dc3545;
    color: white;
    
    &:hover {
      background-color: #c82333;
    }
  ` : `
    background-color: #6c757d;
    color: white;
    
    &:hover {
      background-color: #5a6268;
    }
  `}
`;

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, signout } = useAuth();
  const { connected, userStatuses, getUserStatus } = useSocket();
  const [isEditing, setIsEditing] = useState(false);

  // Get current user's online status
  const currentUserStatus = userStatuses[user?._id] || { isOnline: connected };

  useEffect(() => {
    // Request status for current user when modal opens
    if (isOpen && user?._id && connected) {
      getUserStatus([user._id]);
    }
  }, [isOpen, user?._id, connected, getUserStatus]);

  if (!isOpen) return null;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSignOut = () => {
    signout();
    onClose();
  };

  const handleEditProfile = () => {
    setIsEditing(!isEditing);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Profile Settings</ModalTitle>
          <CloseButton onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <ProfileSection>
            <LargeProfilePicture>
              {getInitials(user?.username)}
            </LargeProfilePicture>
            <ChangePhotoButton>
              Change Photo
            </ChangePhotoButton>
          </ProfileSection>
          
          <InfoSection>
            <InfoItem>
              <InfoLabel>Username</InfoLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <InfoValue>{user?.username || 'N/A'}</InfoValue>
                <EditButton onClick={handleEditProfile}>
                  {isEditing ? 'Save' : 'Edit'}
                </EditButton>
              </div>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>User ID</InfoLabel>
              <InfoValue>{user?.uniqueUserId || 'N/A'}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Email</InfoLabel>
              <InfoValue>{user?.email || 'N/A'}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Member Since</InfoLabel>
              <InfoValue>{formatDate(user?.createdAt)}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Status</InfoLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserStatus 
                  isOnline={currentUserStatus.isOnline} 
                  lastSeen={user?.lastActive}
                  showText={true}
                />
              </div>
            </InfoItem>
          </InfoSection>
          
          <ActionButtons>
            <ActionButton onClick={onClose}>
              Close
            </ActionButton>
            <ActionButton variant="danger" onClick={handleSignOut}>
              Sign Out
            </ActionButton>
          </ActionButtons>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SettingsModal;