import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

// Socket reducer
const socketReducer = (state, action) => {
  switch (action.type) {
    case 'SOCKET_CONNECTING':
      return {
        ...state,
        connected: false,
        connecting: true,
        error: null
      };
    
    case 'SOCKET_CONNECTED':
      return {
        ...state,
        connected: true,
        connecting: false,
        error: null
      };
    
    case 'SOCKET_DISCONNECTED':
      return {
        ...state,
        connected: false,
        connecting: false,
        error: null
      };
    
    case 'SOCKET_ERROR':
      return {
        ...state,
        connected: false,
        connecting: false,
        error: action.payload
      };
    
    case 'NEW_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    
    case 'MESSAGE_SENT':
      return {
        ...state,
        lastMessageSent: action.payload
      };
    
    case 'USER_TYPING':
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.userId]: {
            username: action.payload.username,
            chatId: action.payload.chatId
          }
        }
      };
    
    case 'USER_STOPPED_TYPING':
      const newTypingUsers = { ...state.typingUsers };
      delete newTypingUsers[action.payload.userId];
      return {
        ...state,
        typingUsers: newTypingUsers
      };
    
    case 'USER_STATUS_CHANGED':
      return {
        ...state,
        userStatuses: {
          ...state.userStatuses,
          [action.payload.userId]: {
            isOnline: action.payload.isOnline,
            timestamp: action.payload.timestamp
          }
        }
      };
    
    case 'MESSAGES_READ':
      return {
        ...state,
        readReceipts: {
          ...state.readReceipts,
          [action.payload.chatId]: {
            readBy: action.payload.readBy,
            messageIds: action.payload.messageIds,
            readAt: action.payload.readAt
          }
        }
      };
    
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: []
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  connected: false,
  connecting: false,
  error: null,
  messages: [],
  typingUsers: {},
  userStatuses: {},
  readReceipts: {},
  lastMessageSent: null
};

export const SocketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const currentChatRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  const connectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    dispatch({ type: 'SOCKET_CONNECTING' });

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    socketRef.current = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    // Connection events
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      dispatch({ type: 'SOCKET_CONNECTED' });
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      dispatch({ type: 'SOCKET_DISCONNECTED' });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      dispatch({ 
        type: 'SOCKET_ERROR', 
        payload: error.message || 'Connection failed' 
      });
    });

    // Chat events
    socketRef.current.on('new_message', (data) => {
      dispatch({ 
        type: 'NEW_MESSAGE', 
        payload: data.message 
      });
    });

    socketRef.current.on('message_sent', (data) => {
      dispatch({ 
        type: 'MESSAGE_SENT', 
        payload: data 
      });
    });

    socketRef.current.on('user_typing', (data) => {
      dispatch({ 
        type: 'USER_TYPING', 
        payload: data 
      });
    });

    socketRef.current.on('user_stopped_typing', (data) => {
      dispatch({ 
        type: 'USER_STOPPED_TYPING', 
        payload: data 
      });
    });

    socketRef.current.on('user_status_changed', (data) => {
      dispatch({ 
        type: 'USER_STATUS_CHANGED', 
        payload: data 
      });
    });

    socketRef.current.on('messages_read', (data) => {
      dispatch({ 
        type: 'MESSAGES_READ', 
        payload: data 
      });
    });

    socketRef.current.on('error', (data) => {
      console.error('Socket error:', data);
      dispatch({ 
        type: 'SOCKET_ERROR', 
        payload: data.message || 'Socket error occurred' 
      });
    });
  };

  // Join chat room
  const joinChat = (chatId) => {
    if (socketRef.current && socketRef.current.connected) {
      currentChatRef.current = chatId;
      socketRef.current.emit('join_chat', { chatId });
    }
  };

  // Leave chat room
  const leaveChat = (chatId) => {
    if (socketRef.current && socketRef.current.connected) {
      currentChatRef.current = null;
      socketRef.current.emit('leave_chat', { chatId });
    }
  };

  // Send message
  const sendMessage = (chatId, content, messageType = 'text', replyToId = null) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', {
        chatId,
        content,
        messageType,
        replyToId
      });
    }
  };

  // Send typing indicator
  const startTyping = (chatId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing_start', { chatId });
    }
  };

  const stopTyping = (chatId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing_stop', { chatId });
    }
  };

  // Mark messages as read
  const markMessagesAsRead = (chatId, messageIds = null) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('mark_messages_read', {
        chatId,
        messageIds
      });
    }
  };

  // Get user status
  const getUserStatus = (userIds) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('get_user_status', { userIds });
    }
  };

  // Clear messages (for chat switching)
  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  };

  const value = {
    ...state,
    socket: socketRef.current,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    getUserStatus,
    clearMessages,
    currentChat: currentChatRef.current
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};