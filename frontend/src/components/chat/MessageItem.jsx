import React, { memo } from 'react';
import styled from 'styled-components';

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  margin-bottom: 4px;
  
  ${props => props.isOwn && `
    align-items: flex-end;
  `}
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
  position: relative;
  
  ${props => props.isOwn ? `
    background-color: #007bff;
    color: white;
    border-bottom-right-radius: 4px;
  ` : `
    background-color: #f1f3f4;
    color: #333;
    border-bottom-left-radius: 4px;
  `}
`;

const MessageInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
  
  ${props => props.isOwn && `
    flex-direction: row-reverse;
  `}
`;

const SenderName = styled.span`
  font-weight: 500;
`;

const MessageTime = styled.span`
  opacity: 0.7;
`;

const MessageStatus = styled.span`
  font-size: 10px;
  opacity: 0.8;
`;

const ReplyContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.1);
  border-left: 3px solid rgba(0, 0, 0, 0.2);
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 13px;
  opacity: 0.8;
`;

const EditedIndicator = styled.span`
  font-style: italic;
  opacity: 0.7;
  font-size: 11px;
`;

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
};

const getMessageStatus = (message, isOwn) => {
  if (!isOwn) return null;
  
  if (message.readBy && message.readBy.length > 1) {
    return 'Read';
  } else if (message.deliveredAt) {
    return 'Delivered';
  } else {
    return 'Sent';
  }
};

const MessageItem = memo(({ 
  message, 
  isOwn, 
  showSender = true,
  onReply,
  onEdit,
  onDelete 
}) => {
  const handleContextMenu = (e) => {
    e.preventDefault();
    // Could implement context menu here
  };

  return (
    <MessageContainer isOwn={isOwn} onContextMenu={handleContextMenu}>
      {message.replyTo && (
        <ReplyContainer>
          <div>Replying to: {message.replyTo.content}</div>
        </ReplyContainer>
      )}
      
      <MessageBubble isOwn={isOwn}>
        {message.content}
        {message.editedAt && (
          <EditedIndicator> (edited)</EditedIndicator>
        )}
      </MessageBubble>
      
      <MessageInfo isOwn={isOwn}>
        {showSender && !isOwn && (
          <SenderName>{message.sender?.username || 'Unknown'}</SenderName>
        )}
        <MessageTime>{formatTime(message.createdAt)}</MessageTime>
        {isOwn && (
          <MessageStatus>{getMessageStatus(message, isOwn)}</MessageStatus>
        )}
      </MessageInfo>
    </MessageContainer>
  );
});

MessageItem.displayName = 'MessageItem';

// Custom comparison function for memo
const areEqual = (prevProps, nextProps) => {
  // Compare message content and metadata
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (prevProps.message.content !== nextProps.message.content) return false;
  if (prevProps.message.editedAt !== nextProps.message.editedAt) return false;
  if (prevProps.isOwn !== nextProps.isOwn) return false;
  if (prevProps.showSender !== nextProps.showSender) return false;
  
  // Compare read status for own messages
  if (prevProps.isOwn) {
    const prevReadCount = prevProps.message.readBy?.length || 0;
    const nextReadCount = nextProps.message.readBy?.length || 0;
    if (prevReadCount !== nextReadCount) return false;
  }
  
  return true;
};

export default memo(MessageItem, areEqual);