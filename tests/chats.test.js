const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Chat = require('../src/models/Chat');
const Message = require('../src/models/Message');

describe('Chat Endpoints', () => {
  let authToken1, authToken2;
  let user1, user2, user3;
  let chat;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});

    // Create test users
    const signupResponse1 = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'user1',
        email: 'user1@example.com',
        password: 'Password123!',
        uniqueUserId: 'USER0001'
      });

    const signupResponse2 = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'user2',
        email: 'user2@example.com',
        password: 'Password123!',
        uniqueUserId: 'USER0002'
      });

    const signupResponse3 = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'user3',
        email: 'user3@example.com',
        password: 'Password123!',
        uniqueUserId: 'USER0003'
      });

    authToken1 = signupResponse1.body.data.token;
    authToken2 = signupResponse2.body.data.token;
    user1 = signupResponse1.body.data.user;
    user2 = signupResponse2.body.data.user;
    user3 = signupResponse3.body.data.user;

    // Create a test chat
    chat = await Chat.createOrGetChat(user1.id, user2.id);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/chats', () => {
    it('should get user chats', async () => {
      const response = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chats).toHaveLength(1);
      expect(response.body.data.chats[0]).toHaveProperty('unreadCount');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/chats')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/chats?limit=5&skip=0')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('hasMore');
    });
  });

  describe('GET /api/chats/with/:otherUserId', () => {
    it('should get or create chat with another user', async () => {
      const response = await request(app)
        .get(`/api/chats/with/${user3.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chat).toBeDefined();
      expect(response.body.data.chat.participants).toHaveLength(2);
    });

    it('should return existing chat if one exists', async () => {
      const response = await request(app)
        .get(`/api/chats/with/${user2.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chat.id).toBe(chat._id.toString());
    });

    it('should return error for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/chats/with/invalid-id')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/chats/with/${fakeUserId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return error when trying to chat with self', async () => {
      const response = await request(app)
        .get(`/api/chats/with/${user1.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CHAT');
    });
  });

  describe('GET /api/chats/:chatId', () => {
    it('should get chat by ID', async () => {
      const response = await request(app)
        .get(`/api/chats/${chat._id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chat.id).toBe(chat._id.toString());
      expect(response.body.data.chat).toHaveProperty('unreadCount');
      expect(response.body.data.chat).toHaveProperty('stats');
    });

    it('should return error for non-existent chat', async () => {
      const fakeChatId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/chats/${fakeChatId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CHAT_NOT_FOUND');
    });

    it('should return error for unauthorized access', async () => {
      const response = await request(app)
        .get(`/api/chats/${chat._id}`)
        .set('Authorization', `Bearer ${authToken2}`) // user2 should have access
        .expect(200);

      expect(response.body.success).toBe(true);

      // But user3 should not have access
      const signupResponse3 = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'user4',
          email: 'user4@example.com',
          password: 'Password123!',
          uniqueUserId: 'USER0004'
        });

      const authToken3 = signupResponse3.body.data.token;

      const unauthorizedResponse = await request(app)
        .get(`/api/chats/${chat._id}`)
        .set('Authorization', `Bearer ${authToken3}`)
        .expect(403);

      expect(unauthorizedResponse.body.success).toBe(false);
      expect(unauthorizedResponse.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/chats/:chatId/messages', () => {
    let message1, message2;

    beforeEach(async () => {
      // Create test messages
      message1 = new Message({
        chatId: chat._id,
        sender: user1.id,
        content: 'First message'
      });
      await message1.save();

      message2 = new Message({
        chatId: chat._id,
        sender: user2.id,
        content: 'Second message'
      });
      await message2.save();
    });

    it('should get chat messages', async () => {
      const response = await request(app)
        .get(`/api/chats/${chat._id}/messages`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(2);
      expect(response.body.data.messages[0].content).toBe('First message');
      expect(response.body.data.messages[1].content).toBe('Second message');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/chats/${chat._id}/messages?limit=1&skip=0`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(1);
      expect(response.body.data.hasMore).toBe(true);
    });

    it('should get messages after timestamp', async () => {
      const timestamp = message1.createdAt.toISOString();
      
      const response = await request(app)
        .get(`/api/chats/${chat._id}/messages?after=${timestamp}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(1);
      expect(response.body.data.messages[0].content).toBe('Second message');
    });

    it('should return error for unauthorized access', async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'unauthorized',
          email: 'unauthorized@example.com',
          password: 'Password123!',
          uniqueUserId: 'UNAUTH01'
        });

      const unauthorizedToken = signupResponse.body.data.token;

      const response = await request(app)
        .get(`/api/chats/${chat._id}/messages`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/chats/:chatId/messages', () => {
    it('should send a message', async () => {
      const messageData = {
        content: 'Hello world',
        messageType: 'text'
      };

      const response = await request(app)
        .post(`/api/chats/${chat._id}/messages`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe(messageData.content);
      expect(response.body.data.message.sender.id).toBe(user1.id);

      // Verify message was saved to database
      const savedMessage = await Message.findById(response.body.data.message.id);
      expect(savedMessage).toBeTruthy();
    });

    it('should return error for empty content', async () => {
      const response = await request(app)
        .post(`/api/chats/${chat._id}/messages`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for content too long', async () => {
      const longContent = 'a'.repeat(1001);
      
      const response = await request(app)
        .post(`/api/chats/${chat._id}/messages`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: longContent })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should support reply to message', async () => {
      // Create original message
      const originalMessage = new Message({
        chatId: chat._id,
        sender: user1.id,
        content: 'Original message'
      });
      await originalMessage.save();

      const response = await request(app)
        .post(`/api/chats/${chat._id}/messages`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Reply message',
          replyToId: originalMessage._id.toString()
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.replyTo).toBeDefined();
    });
  });

  describe('PUT /api/chats/:chatId/read', () => {
    let message;

    beforeEach(async () => {
      message = new Message({
        chatId: chat._id,
        sender: user2.id,
        content: 'Unread message'
      });
      await message.save();
    });

    it('should mark messages as read', async () => {
      const response = await request(app)
        .put(`/api/chats/${chat._id}/read`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify message was marked as read
      const updatedMessage = await Message.findById(message._id);
      expect(updatedMessage.readBy).toHaveLength(1);
      expect(updatedMessage.readBy[0].user.toString()).toBe(user1.id);
    });

    it('should mark specific messages as read', async () => {
      const response = await request(app)
        .put(`/api/chats/${chat._id}/read`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ messageIds: [message._id.toString()] })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/messages/:messageId', () => {
    let message;

    beforeEach(async () => {
      message = new Message({
        chatId: chat._id,
        sender: user1.id,
        content: 'Original content'
      });
      await message.save();
    });

    it('should edit message', async () => {
      const newContent = 'Edited content';
      
      const response = await request(app)
        .put(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: newContent })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe(newContent);
      expect(response.body.data.message.editedAt).toBeDefined();
    });

    it('should return error for unauthorized edit', async () => {
      const response = await request(app)
        .put(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${authToken2}`) // Different user
        .send({ content: 'Hacked content' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return error for empty content', async () => {
      const response = await request(app)
        .put(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/messages/:messageId', () => {
    let message;

    beforeEach(async () => {
      message = new Message({
        chatId: chat._id,
        sender: user1.id,
        content: 'Message to delete'
      });
      await message.save();
    });

    it('should delete message', async () => {
      const response = await request(app)
        .delete(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify message was soft deleted
      const deletedMessage = await Message.findById(message._id);
      expect(deletedMessage.isDeleted).toBe(true);
      expect(deletedMessage.deletedAt).toBeDefined();
    });

    it('should return error for unauthorized delete', async () => {
      const response = await request(app)
        .delete(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${authToken2}`) // Different user
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/chats/:chatId/search', () => {
    beforeEach(async () => {
      // Create messages with different content
      const messages = [
        { content: 'Hello world', sender: user1.id },
        { content: 'How are you?', sender: user2.id },
        { content: 'Hello there', sender: user1.id },
        { content: 'Goodbye', sender: user2.id }
      ];

      for (const msgData of messages) {
        const message = new Message({
          chatId: chat._id,
          sender: msgData.sender,
          content: msgData.content
        });
        await message.save();
      }
    });

    it('should search messages in chat', async () => {
      const response = await request(app)
        .get(`/api/chats/${chat._id}/search?q=hello`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(2);
      expect(response.body.data.searchTerm).toBe('hello');
    });

    it('should return error for empty search term', async () => {
      const response = await request(app)
        .get(`/api/chats/${chat._id}/search?q=`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should support search limit', async () => {
      const response = await request(app)
        .get(`/api/chats/${chat._id}/search?q=hello&limit=1`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(1);
    });
  });
});