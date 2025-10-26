import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import VirtualizedList from '../common/VirtualizedList';
import MessageItem from './MessageItem';
import { useRenderPerformance } from '../../hooks/usePerformanceMonitor';

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow: hidden;
`;

const LoadingMore = styled.div`
  padding: 16px;
  text-align: center;
  color: #666;
  font-size: 14px;
`;

const DateSeparator = styled.div`
  display: flex;
  align-items: center;
  margin: 16px 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: #e1e5e9;
  }
  
  span {
    padding: 0 16px;
    font-size: 12px;
    color: #666;
    background-color: white;
  }
`;

const ITEM_HEIGHT = 80; // Average message height
const CONTAINER_HEIGHT = 400; // Default container height

const OptimizedMessageList = memo(({
  messages = [],
  currentUserId,
  onLoadMore,
  hasMore = false,
  loading = false,
  containerHeight = CONTAINER_HEIGHT,
  onMessageReply,
  onMessageEdit,
  onMessageDelete,
  className
}) => {
  useRenderPerformance('OptimizedMessageList');
  
  const containerRef = useRef(null);
  const loadingTriggered = useRef(false);

  // Group messages by date and add date separators
  const messagesWithSeparators = useMemo(() => {
    if (!messages.length) return [];

    const result = [];
    let lastDate = null;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      // Add date separator if date changed
      if (messageDate !== lastDate) {
        result.push({
          id: `date-${messageDate}`,
          type: 'date-separator',
          date: messageDate,
          height: 40
        });
        lastDate = messageDate;
      }

      // Add message with metadata
      result.push({
        ...message,
        type: 'message',
        isOwn: message.sender?.id === currentUserId,
        showSender: index === 0 || messages[index - 1]?.sender?.id !== message.sender?.id,
        height: ITEM_HEIGHT
      });
    });

    return result;
  }, [messages, currentUserId]);

  // Calculate dynamic item height
  const getItemHeight = useCallback((item) => {
    if (item.type === 'date-separator') return 40;
    
    // Estimate height based on content length
    const baseHeight = 60;
    const contentLines = Math.ceil(item.content?.length / 50) || 1;
    const replyHeight = item.replyTo ? 30 : 0;
    
    return Math.max(baseHeight, contentLines * 20 + replyHeight + 40);
  }, []);

  // Render individual items
  const renderItem = useCallback((item, index) => {
    if (item.type === 'date-separator') {
      return (
        <DateSeparator>
          <span>{new Date(item.date).toLocaleDateString()}</span>
        </DateSeparator>
      );
    }

    return (
      <MessageItem
        message={item}
        isOwn={item.isOwn}
        showSender={item.showSender}
        onReply={onMessageReply}
        onEdit={onMessageEdit}
        onDelete={onMessageDelete}
      />
    );
  }, [onMessageReply, onMessageEdit, onMessageDelete]);

  // Handle scroll for loading more messages
  const handleScroll = useCallback((event) => {
    const { scrollTop } = event.target;
    
    // Load more when scrolled to top
    if (scrollTop < 100 && hasMore && !loading && !loadingTriggered.current) {
      loadingTriggered.current = true;
      onLoadMore?.();
      
      // Reset loading trigger after a delay
      setTimeout(() => {
        loadingTriggered.current = false;
      }, 1000);
    }
  }, [hasMore, loading, onLoadMore]);

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      const isAtBottom = containerRef.current.scrollTop + containerRef.current.clientHeight >= 
                        containerRef.current.scrollHeight - 100;
      
      if (isAtBottom) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [messages.length]);

  if (!messages.length) {
    return (
      <Container className={className}>
        <MessagesContainer>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#666',
            fontSize: '16px'
          }}>
            No messages yet. Start the conversation!
          </div>
        </MessagesContainer>
      </Container>
    );
  }

  return (
    <Container className={className}>
      {loading && hasMore && (
        <LoadingMore>Loading more messages...</LoadingMore>
      )}
      
      <MessagesContainer ref={containerRef}>
        <VirtualizedList
          items={messagesWithSeparators}
          itemHeight={ITEM_HEIGHT}
          containerHeight={containerHeight}
          renderItem={renderItem}
          onScroll={handleScroll}
          overscan={3}
        />
      </MessagesContainer>
    </Container>
  );
});

OptimizedMessageList.displayName = 'OptimizedMessageList';

export default OptimizedMessageList;