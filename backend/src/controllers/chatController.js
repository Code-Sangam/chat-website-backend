const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const messageService = require('../services/messageService');

// Get all chats for current user
const getUserChats = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, skip = 0 } = req.query;

    const chats = await Chat.findUserChats(userId, parseInt(limit), parseInt(skip));

    // Add unread count for each chat
    const chatsWithUnreadCount = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await messageService.getUnreadCount(userId, chat._id);
        const chatObj = chat.toJSON();
        chatObj.unreadCount = unreadCount;
        return chatObj;
      })
    );

    res.json({
      success: true,
      data: {
        chats: chatsWithUnreadCount,
        count: chatsWithUnreadCount.length,
        hasMore: chatsWithUnreadCount.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching chats'
      }
    });
  }
};

// Get or create chat between current user and another user
const getOrCreateChat = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    // Validate other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Cannot create chat with self
    if (userId === otherUserId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CHAT',
          message: 'Cannot create chat with yourself'
        }
      });
    }

    const chat = await Chat.createOrGetChat(userId, otherUserId);
    const unreadCount = await messageService.getUnreadCount(userId, chat._id);

    const chatData = chat.toJSON();
    chatData.unreadCount = unreadCount;

    res.json({
      success: true,
      data: {
        chat: chatData
      }
    });

  } catch (error) {
    console.error('Get or create chat error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating chat'
      }
    });
  }
};

// Get chat by ID
const getChatById = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate('participants', 'uniqueUserId username isOnline lastActive')
      .populate('lastMessage.sender', 'uniqueUserId username');

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHAT_NOT_FOUND',
          message: 'Chat not found'
        }
      });
    }

    // Verify user is participant
    if (!chat.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not a participant in this chat'
        }
      });
    }

    const unreadCount = await messageService.getUnreadCount(userId, chat._id);
    const chatStats = await messageService.getChatStats(userId, chat._id);

    const chatData = chat.toJSON();
    chatData.unreadCount = unreadCount;
    chatData.stats = chatStats;

    res.json({
      success: true,
      data: {
        chat: chatData
      }
    });

  } catch (error) {
    console.error('Get chat by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching chat'
      }
    });
  }
};

// Get messages for a chat
const getChatMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    const { limit = 50, skip = 0, after } = req.query;

    let messages;

    if (after) {
      // Get messages after specific timestamp (for real-time sync)
      messages = await messageService.getMessagesAfter(userId, chatId, after);
    } else {
      // Get messages with pagination
      messages = await messageService.getChatMessages(
        userId, 
        chatId, 
        parseInt(limit), 
        parseInt(skip)
      );
    }

    res.json({
      success: true,
      data: {
        messages,
        count: messages.length,
        hasMore: !after && messages.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get chat messages error:', error);
    
    if (error.message === 'Unauthorized to access this chat') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching messages'
      }
    });
  }
};

// Send a message to a chat
const sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    const { content, messageType = 'text', replyToId } = req.body;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Message content is required'
        }
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Message content cannot exceed 1000 characters'
        }
      });
    }

    const message = await messageService.sendMessage(
      userId, 
      chatId, 
      content, 
      messageType, 
      replyToId
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: message.toJSON()
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not a participant')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while sending message'
      }
    });
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    const { messageIds } = req.body;

    await messageService.markMessagesAsRead(userId, chatId, messageIds);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark messages as read error:', error);
    
    if (error.message === 'Unauthorized to access this chat') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while marking messages as read'
      }
    });
  }
};

// Edit a message
const editMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;
    const { content } = req.body;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Message content is required'
        }
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Message content cannot exceed 1000 characters'
        }
      });
    }

    const message = await messageService.editMessage(userId, messageId, content);

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: {
        message: message.toJSON()
      }
    });

  } catch (error) {
    console.error('Edit message error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message
        }
      });
    }

    if (error.message.includes('too old')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EDIT_TIME_EXPIRED',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while editing message'
      }
    });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    await messageService.deleteMessage(userId, messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting message'
      }
    });
  }
};

// Search messages in a chat
const searchChatMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    const { q: searchTerm, limit = 20 } = req.query;

    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Search term is required'
        }
      });
    }

    const messages = await messageService.searchMessages(
      userId, 
      chatId, 
      searchTerm.trim(), 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        messages,
        searchTerm: searchTerm.trim(),
        count: messages.length
      }
    });

  } catch (error) {
    console.error('Search chat messages error:', error);
    
    if (error.message === 'Unauthorized to search this chat') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while searching messages'
      }
    });
  }
};

module.exports = {
  getUserChats,
  getOrCreateChat,
  getChatById,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  searchChatMessages
};