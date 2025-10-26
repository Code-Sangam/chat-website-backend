import api from './api';

// Retry helper function for chat operations
const retryRequest = async (requestFn, maxRetries = 3, delay = 1500) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      console.log(`Chat request attempt ${i + 1} failed:`, error.message);
      
      // Don't retry on client errors (4xx) except 408 (timeout)
      if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 408) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (i === maxRetries) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

export const chatService = {
  // Create or get existing chat with another user
  createOrGetChat: async (otherUserId) => {
    return retryRequest(async () => {
      console.log(`Creating chat with user: ${otherUserId}`);
      const response = await api.get(`/chats/with/${otherUserId}`);
      console.log('Chat creation response:', response.data);
      return response.data;
    });
  },

  // Get all user chats
  getUserChats: async (limit = 20, skip = 0) => {
    return retryRequest(async () => {
      const response = await api.get(`/chats?limit=${limit}&skip=${skip}`);
      return response.data;
    });
  },

  // Get chat by ID
  getChatById: async (chatId) => {
    return retryRequest(async () => {
      const response = await api.get(`/chats/${chatId}`);
      return response.data;
    });
  },

  // Get chat messages
  getChatMessages: async (chatId, limit = 50, skip = 0) => {
    return retryRequest(async () => {
      const response = await api.get(`/chats/${chatId}/messages?limit=${limit}&skip=${skip}`);
      return response.data;
    });
  },

  // Send message to chat
  sendMessage: async (chatId, content, messageType = 'text', replyToId = null) => {
    return retryRequest(async () => {
      const response = await api.post(`/chats/${chatId}/messages`, {
        content,
        messageType,
        replyToId
      });
      return response.data;
    });
  },

  // Mark messages as read
  markMessagesAsRead: async (chatId, messageIds = null) => {
    return retryRequest(async () => {
      const response = await api.put(`/chats/${chatId}/read`, {
        messageIds
      });
      return response.data;
    });
  }
};