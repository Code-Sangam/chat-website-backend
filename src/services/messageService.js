const Message = require('../models/Message');
const Chat = require('../models/Chat');
const socketService = require('./socketService');

class MessageService {
  // Send a new message
  async sendMessage(senderId, chatId, content, messageType = 'text', replyToId = null) {
    try {
      // Verify chat exists and user is participant
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      if (!chat.isParticipant(senderId)) {
        throw new Error('User is not a participant in this chat');
      }

      // Create message
      const messageData = {
        chatId,
        sender: senderId,
        content: content.trim(),
        messageType
      };

      if (replyToId) {
        // Verify reply-to message exists in the same chat
        const replyToMessage = await Message.findOne({
          _id: replyToId,
          chatId,
          isDeleted: false
        });

        if (replyToMessage) {
          messageData.replyTo = replyToId;
        }
      }

      const message = new Message(messageData);
      await message.save();

      // Populate sender information
      await message.populate('sender', 'uniqueUserId username');
      
      // Populate reply-to message if exists
      if (message.replyTo) {
        await message.populate('replyTo', 'content sender createdAt');
      }

      // Update chat's last message
      await chat.updateLastMessage({
        content: message.content,
        sender: senderId,
        timestamp: message.createdAt,
        messageType: message.messageType
      });

      // Broadcast message to chat participants via WebSocket
      socketService.sendToChat(chatId, 'new_message', {
        message: message.toJSON(),
        chatId
      });

      // Send push notification to offline users (if implemented)
      await this.notifyOfflineUsers(chat, message);

      return message;

    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  // Get messages for a chat with pagination
  async getChatMessages(userId, chatId, limit = 50, skip = 0) {
    try {
      // Verify user is participant in chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.isParticipant(userId)) {
        throw new Error('Unauthorized to access this chat');
      }

      const messages = await Message.findChatMessages(chatId, limit, skip);
      
      // Reverse to get chronological order (oldest first)
      return messages.reverse();

    } catch (error) {
      console.error('Get chat messages error:', error);
      throw error;
    }
  }

  // Get messages after a specific timestamp (for real-time sync)
  async getMessagesAfter(userId, chatId, timestamp) {
    try {
      // Verify user is participant in chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.isParticipant(userId)) {
        throw new Error('Unauthorized to access this chat');
      }

      return await Message.findMessagesAfter(chatId, new Date(timestamp));

    } catch (error) {
      console.error('Get messages after error:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(userId, chatId, messageIds = null) {
    try {
      // Verify user is participant in chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.isParticipant(userId)) {
        throw new Error('Unauthorized to access this chat');
      }

      const markedMessages = await Message.markAsRead(chatId, userId, messageIds);

      // Notify other participants via WebSocket
      socketService.sendToChat(chatId, 'messages_read', {
        chatId,
        readBy: userId,
        messageIds: markedMessages.map(msg => msg._id),
        readAt: new Date()
      }, userId); // Exclude the user who marked as read

      return markedMessages;

    } catch (error) {
      console.error('Mark messages as read error:', error);
      throw error;
    }
  }

  // Edit a message
  async editMessage(userId, messageId, newContent) {
    try {
      const message = await Message.findById(messageId);
      
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.sender.toString() !== userId) {
        throw new Error('Unauthorized to edit this message');
      }

      if (message.isDeleted) {
        throw new Error('Cannot edit deleted message');
      }

      // Check if message is too old to edit (e.g., 15 minutes)
      const editTimeLimit = 15 * 60 * 1000; // 15 minutes
      const messageAge = Date.now() - message.createdAt.getTime();
      
      if (messageAge > editTimeLimit) {
        throw new Error('Message is too old to edit');
      }

      await message.editContent(newContent.trim());
      await message.populate('sender', 'uniqueUserId username');

      // Broadcast message edit to chat participants
      socketService.sendToChat(message.chatId, 'message_edited', {
        messageId: message._id,
        newContent: message.content,
        editedAt: message.editedAt,
        chatId: message.chatId
      });

      return message;

    } catch (error) {
      console.error('Edit message error:', error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(userId, messageId) {
    try {
      const message = await Message.findById(messageId);
      
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.sender.toString() !== userId) {
        throw new Error('Unauthorized to delete this message');
      }

      if (message.isDeleted) {
        throw new Error('Message already deleted');
      }

      await message.softDelete();

      // Update chat's last message if this was the last message
      const chat = await Chat.findById(message.chatId);
      if (chat.lastMessage.timestamp.getTime() === message.createdAt.getTime()) {
        // Find the previous message to update last message
        const previousMessage = await Message.findOne({
          chatId: message.chatId,
          isDeleted: false,
          createdAt: { $lt: message.createdAt }
        }).sort({ createdAt: -1 });

        if (previousMessage) {
          await chat.updateLastMessage({
            content: previousMessage.content,
            sender: previousMessage.sender,
            timestamp: previousMessage.createdAt,
            messageType: previousMessage.messageType
          });
        } else {
          // No previous messages, clear last message
          await chat.updateLastMessage({
            content: '',
            sender: null,
            timestamp: new Date(),
            messageType: 'text'
          });
        }
      }

      // Broadcast message deletion to chat participants
      socketService.sendToChat(message.chatId, 'message_deleted', {
        messageId: message._id,
        chatId: message.chatId,
        deletedAt: message.deletedAt
      });

      return message;

    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }

  // Get unread message count for a user in a chat
  async getUnreadCount(userId, chatId) {
    try {
      return await Message.countUnreadMessages(chatId, userId);
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }

  // Search messages in a chat
  async searchMessages(userId, chatId, searchTerm, limit = 20) {
    try {
      // Verify user is participant in chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.isParticipant(userId)) {
        throw new Error('Unauthorized to search this chat');
      }

      const messages = await Message.find({
        chatId,
        content: { $regex: searchTerm, $options: 'i' },
        isDeleted: false
      })
      .populate('sender', 'uniqueUserId username')
      .sort({ createdAt: -1 })
      .limit(limit);

      return messages;

    } catch (error) {
      console.error('Search messages error:', error);
      throw error;
    }
  }

  // Notify offline users about new messages (placeholder for push notifications)
  async notifyOfflineUsers(chat, message) {
    try {
      // Get offline participants
      const offlineParticipants = [];
      
      for (const participantId of chat.participants) {
        if (participantId.toString() !== message.sender.toString()) {
          const isOnline = socketService.isUserOnline(participantId.toString());
          if (!isOnline) {
            offlineParticipants.push(participantId);
          }
        }
      }

      // Here you would implement push notifications, email notifications, etc.
      // For now, just log the offline users
      if (offlineParticipants.length > 0) {
        console.log(`New message notification needed for offline users: ${offlineParticipants.join(', ')}`);
      }

    } catch (error) {
      console.error('Notify offline users error:', error);
    }
  }

  // Get message statistics for a chat
  async getChatStats(userId, chatId) {
    try {
      // Verify user is participant in chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.isParticipant(userId)) {
        throw new Error('Unauthorized to access this chat');
      }

      const totalMessages = await Message.countDocuments({
        chatId,
        isDeleted: false
      });

      const unreadCount = await this.getUnreadCount(userId, chatId);

      const userMessageCount = await Message.countDocuments({
        chatId,
        sender: userId,
        isDeleted: false
      });

      return {
        totalMessages,
        unreadCount,
        userMessageCount,
        otherUserMessageCount: totalMessages - userMessageCount
      };

    } catch (error) {
      console.error('Get chat stats error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const messageService = new MessageService();

module.exports = messageService;