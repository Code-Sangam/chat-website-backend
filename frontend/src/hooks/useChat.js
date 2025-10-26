import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';

export const useChat = (chatId, selectedUser) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesLoadedRef = useRef(false);
  
  const { user } = useAuth();
  const {
    connected,
    joinChat,
    leaveChat,
    sendMessage,
    messages: socketMessages,
    clearMessages,
    currentChat,
    markMessagesAsRead
  } = useSocket();

  // Load initial messages from API
  const loadMessages = useCallback(async () => {
    if (!chatId || !selectedUser) return;

    setLoading(true);
    setError('');
    messagesLoadedRef.current = false;

    try {
      const response = await chatService.getChatMessages(chatId);
      
      if (response.success) {
        const apiMessages = (response.data.messages || []).map(msg => ({
          ...msg,
          isOwn: msg.sender?.uniqueUserId === getCurrentUserId()
        }));
        setMessages(apiMessages);
        messagesLoadedRef.current = true;
      } else {
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to load messages. Please try again.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [chatId, selectedUser]);

  // Get current user ID from auth context
  const getCurrentUserId = () => {
    return user?.uniqueUserId || user?._id;
  };

  // Join/leave chat rooms
  useEffect(() => {
    if (chatId && selectedUser && connected) {
      joinChat(chatId);
      loadMessages();
    } else {
      setMessages([]);
      setError('');
      clearMessages();
    }

    return () => {
      if (currentChat) {
        leaveChat(currentChat);
      }
    };
  }, [chatId, selectedUser, connected, joinChat, leaveChat, clearMessages, currentChat, loadMessages]);

  // Handle real-time messages
  useEffect(() => {
    if (!messagesLoadedRef.current || !chatId) return;

    if (socketMessages.length > 0) {
      const newMessages = socketMessages.filter(msg => msg.chatId === chatId);
      
      if (newMessages.length > 0) {
        setMessages(prev => {
          const messageMap = new Map();
          
          // Add existing messages
          prev.forEach(msg => {
            messageMap.set(msg._id, msg);
          });
          
          // Process new messages
          newMessages.forEach(newMsg => {
            // Remove any pending messages with same content
            const pendingMessages = Array.from(messageMap.values()).filter(m => 
              m.isPending && m.content === newMsg.content
            );
            
            pendingMessages.forEach(pending => {
              messageMap.delete(pending._id);
            });
            
            // Add new message
            if (!messageMap.has(newMsg._id)) {
              messageMap.set(newMsg._id, {
                ...newMsg,
                isOwn: newMsg.sender?.uniqueUserId === getCurrentUserId()
              });
            }
          });
          
          // Return sorted messages
          return Array.from(messageMap.values()).sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
        });
      }
    }
  }, [socketMessages, chatId]);

  // Send message function
  const handleSendMessage = useCallback(async (messageContent) => {
    if (!chatId || !selectedUser || !connected) {
      throw new Error('Cannot send message: not connected or no chat selected');
    }

    // Create optimistic message
    const optimisticMessage = {
      _id: `temp_${Date.now()}_${Math.random()}`,
      content: messageContent,
      sender: { 
        username: user?.username || 'You',
        uniqueUserId: getCurrentUserId()
      },
      timestamp: new Date().toISOString(),
      isOwn: true,
      isPending: true
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Send via WebSocket
      sendMessage(chatId, messageContent);
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      throw err;
    }
  }, [chatId, selectedUser, connected, sendMessage]);

  // Mark messages as read when chat is viewed
  useEffect(() => {
    if (chatId && messages.length > 0 && connected) {
      const unreadMessages = messages.filter(msg => !msg.isOwn && !msg.isRead);
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg._id);
        markMessagesAsRead(chatId, messageIds);
      }
    }
  }, [chatId, messages, connected, markMessagesAsRead]);

  return {
    messages,
    loading,
    error,
    sendMessage: handleSendMessage,
    connected,
    refreshMessages: loadMessages
  };
};