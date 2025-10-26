const { Server } = require('socket.io');
const socketAuth = require('../middleware/socketAuth');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.userSockets = new Map(); // socketId -> userId mapping
  }

  initialize(server) {
    // Allow Vercel deployments and localhost for Socket.io
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'https://localhost:3000'
    ];

    this.io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin
          if (!origin) return callback(null, true);
          
          // Check if origin is in allowed list
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          
          // Allow Vercel preview deployments
          if (origin.includes('chat-website-frontend') && origin.includes('vercel.app')) {
            return callback(null, true);
          }
          
          // Reject other origins
          callback(new Error('Not allowed by CORS'));
        },
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Apply authentication middleware
    this.io.use(socketAuth);

    // Handle connections
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('Socket.io server initialized');
  }

  async handleConnection(socket) {
    try {
      const userId = socket.userId;
      const user = socket.user;

      console.log(`User connected: ${user.username} (${userId})`);

      // Store user connection using both MongoDB ID and uniqueUserId for compatibility
      this.connectedUsers.set(userId, socket.id);
      this.connectedUsers.set(user.uniqueUserId, socket.id);
      this.userSockets.set(socket.id, { userId, uniqueUserId: user.uniqueUserId });

      // Update user online status
      await user.setOnlineStatus(true);

      // Join user to their personal room
      socket.join(`user_${userId}`);
      socket.join(`user_${user.uniqueUserId}`);

      // Emit user online status to their contacts
      this.broadcastUserStatus(userId, user.uniqueUserId, true);

      // Handle chat events
      this.setupChatHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

    } catch (error) {
      console.error('Connection handling error:', error);
      socket.emit('error', { message: 'Connection failed' });
    }
  }

  setupChatHandlers(socket) {
    const userId = socket.userId;
    const messageService = require('./messageService');

    // Join chat room
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;

        // Verify user is participant in this chat
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isParticipant(userId)) {
          socket.emit('error', { message: 'Unauthorized to join this chat' });
          return;
        }

        // Join chat room
        socket.join(`chat_${chatId}`);
        
        // Leave previous chat rooms (for single chat at a time)
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room.startsWith('chat_') && room !== `chat_${chatId}`) {
            socket.leave(room);
          }
        });

        socket.emit('chat_joined', { chatId });
        console.log(`User ${userId} joined chat ${chatId}`);

      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Leave chat room
    socket.on('leave_chat', (data) => {
      try {
        const { chatId } = data;
        socket.leave(`chat_${chatId}`);
        socket.emit('chat_left', { chatId });
        console.log(`User ${userId} left chat ${chatId}`);
      } catch (error) {
        console.error('Leave chat error:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      try {
        const { chatId } = data;
        socket.to(`chat_${chatId}`).emit('user_typing', {
          userId,
          username: socket.user.username,
          chatId
        });
      } catch (error) {
        console.error('Typing start error:', error);
      }
    });

    socket.on('typing_stop', (data) => {
      try {
        const { chatId } = data;
        socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
          userId,
          chatId
        });
      } catch (error) {
        console.error('Typing stop error:', error);
      }
    });

    // Handle message read receipts
    socket.on('mark_messages_read', async (data) => {
      try {
        const { chatId, messageIds } = data;

        // Verify user is participant
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isParticipant(userId)) {
          return;
        }

        // Mark messages as read
        await Message.markAsRead(chatId, userId, messageIds);

        // Notify other participants
        socket.to(`chat_${chatId}`).emit('messages_read', {
          chatId,
          readBy: userId,
          messageIds
        });

      } catch (error) {
        console.error('Mark messages read error:', error);
      }
    });

    // Handle message sending
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, messageType = 'text', replyToId } = data;

        // Validate input
        if (!chatId || !content || content.trim().length === 0) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Send message through message service
        const message = await messageService.sendMessage(
          userId, 
          chatId, 
          content, 
          messageType, 
          replyToId
        );

        // Confirm message sent to sender
        socket.emit('message_sent', {
          messageId: message._id,
          chatId,
          timestamp: message.createdAt
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { 
          message: error.message || 'Failed to send message' 
        });
      }
    });

    // Handle user status requests
    socket.on('get_user_status', async (data) => {
      try {
        const { userIds } = data;
        const statuses = {};

        for (const targetUserId of userIds) {
          // Check if it's a MongoDB ObjectId or uniqueUserId
          let user;
          let isOnline = false;
          
          if (targetUserId.length === 24) {
            // MongoDB ObjectId
            user = await User.findById(targetUserId);
            isOnline = this.connectedUsers.has(targetUserId);
          } else {
            // uniqueUserId
            user = await User.findByUniqueId(targetUserId);
            isOnline = this.connectedUsers.has(targetUserId);
          }
          
          statuses[targetUserId] = {
            isOnline,
            lastActive: user ? user.lastActive : null
          };
        }

        socket.emit('user_statuses', statuses);

      } catch (error) {
        console.error('Get user status error:', error);
      }
    });
  }

  async handleDisconnection(socket) {
    try {
      const userInfo = this.userSockets.get(socket.id);
      
      if (userInfo) {
        const { userId, uniqueUserId } = userInfo;
        console.log(`User disconnected: ${userId} (${uniqueUserId})`);

        // Remove from connected users
        this.connectedUsers.delete(userId);
        this.connectedUsers.delete(uniqueUserId);
        this.userSockets.delete(socket.id);

        // Update user offline status
        const user = await User.findById(userId);
        if (user) {
          await user.setOnlineStatus(false);
        }

        // Broadcast user offline status
        this.broadcastUserStatus(userId, uniqueUserId, false);
      }

    } catch (error) {
      console.error('Disconnection handling error:', error);
    }
  }

  // Broadcast user online/offline status to their contacts
  async broadcastUserStatus(userId, uniqueUserId, isOnline) {
    try {
      // Skip socket operations if not initialized (e.g., in test environment)
      if (!this.io) {
        return;
      }
      
      // Find all chats where this user is a participant
      const userChats = await Chat.find({
        participants: userId,
        isActive: true
      }).populate('participants', '_id uniqueUserId');

      // Get all other participants (contacts)
      const contacts = new Set();
      userChats.forEach(chat => {
        chat.participants.forEach(participant => {
          if (participant._id.toString() !== userId) {
            contacts.add(participant._id.toString());
          }
        });
      });

      // Emit status update to online contacts with both IDs for compatibility
      contacts.forEach(contactId => {
        const contactSocketId = this.connectedUsers.get(contactId);
        if (contactSocketId) {
          this.io.to(contactSocketId).emit('user_status_changed', {
            userId,
            uniqueUserId,
            isOnline,
            timestamp: new Date()
          });
        }
      });

    } catch (error) {
      console.error('Broadcast user status error:', error);
    }
  }

  // Send message to specific user (accepts both MongoDB ID and uniqueUserId)
  sendToUser(userId, event, data) {
    // Skip socket operations if not initialized (e.g., in test environment)
    if (!this.io) {
      return false;
    }
    
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Send message to chat room
  sendToChat(chatId, event, data, excludeUserId = null) {
    // Skip socket operations if not initialized (e.g., in test environment)
    if (!this.io) {
      return;
    }
    
    if (excludeUserId) {
      const excludeSocketId = this.connectedUsers.get(excludeUserId);
      if (excludeSocketId) {
        this.io.to(`chat_${chatId}`).except(excludeSocketId).emit(event, data);
      } else {
        this.io.to(`chat_${chatId}`).emit(event, data);
      }
    } else {
      this.io.to(`chat_${chatId}`).emit(event, data);
    }
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Get online users list
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  // Check if user is online (accepts both MongoDB ID and uniqueUserId)
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

// Create singleton instance
const socketService = new SocketService();

module.exports = socketService;