const mongoose = require('mongoose');
const Message = require('../../src/models/Message');
const Chat = require('../../src/models/Chat');
const User = require('../../src/models/User');

describe('Message Model', () => {
  let user1, user2, chat;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  beforeEach(async () => {
    await Message.deleteMany({});
    await Chat.deleteMany({});
    await User.deleteMany({});

    // Create test users
    user1 = new User({
      username: 'user1',
      email: 'user1@example.com',
      passwordHash: 'Password123'
    });
    await user1.save();

    user2 = new User({
      username: 'user2',
      email: 'user2@example.com',
      passwordHash: 'Password123'
    });
    await user2.save();

    // Create test chat
    chat = new Chat({
      participants: [user1._id, user2._id]
    });
    await chat.save();
  });

  afterAll(async () => {
    await Message.deleteMany({});
    await Chat.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Message Creation', () => {
    it('should create a message with valid data', async () => {
      const message = new Message({
        chatId: chat._id,
        sender: user1._id,
        content: 'Hello world',
        messageType: 'text'
      });

      const savedMessage = await message.save();

      expect(savedMessage.chatId.toString()).toBe(chat._id.toString());
      expect(savedMessage.sender.toString()).toBe(user1._id.toString());
      expect(savedMessage.content).toBe('Hello world');
      expect(savedMessage.messageType).toBe('text');
      expect(savedMessage.isRead).toBe(false);
      expect(savedMessage.isDeleted).toBe(false);
      expect(savedMessage.createdAt).toBeDefined();
    });

    it('should require chat ID', async () => {
      const message = new Message({
        sender: user1._id,
        content: 'Hello world'
      });

      await expect(message.save()).rejects.toThrow('Chat ID is required');
    });

    it('should require sender', async () => {
      const message = new Message({
        chatId: chat._id,
        content: 'Hello world'
      });

      await expect(message.save()).rejects.toThrow('Sender is required');
    });

    it('should require content for text messages', async () => {
      const message = new Message({
        chatId: chat._id,
        sender: user1._id,
        content: '',
        messageType: 'text'
      });

      await expect(message.save()).rejects.toThrow('Message content is required');
    });

    it('should validate content length', async () => {
      const longContent = 'a'.repeat(1001);
      const message = new Message({
        chatId: chat._id,
        sender: user1._id,
        content: longContent
      });

      await expect(message.save()).rejects.toThrow('Message content cannot exceed 1000 characters');
    });

    it('should validate message type', async () => {
      const message = new Message({
        chatId: chat._id,
        sender: user1._id,
        content: 'Hello world',
        messageType: 'invalid'
      });

      await expect(message.save()).rejects.toThrow();
    });
  });

  describe('Message Static Methods', () => {
    let message1, message2, message3;

    beforeEach(async () => {
      message1 = new Message({
        chatId: chat._id,
        sender: user1._id,
        content: 'First message'
      });
      await message1.save();

      message2 = new Message({
        chatId: chat._id,
        sender: user2._id,
        content: 'Second message'
      });
      await message2.save();

      message3 = new Message({
        chatId: chat._id,
        sender: user1._id,
        content: 'Third message',
        isDeleted: true
      });
      await message3.save();
    });

    it('should find chat messages with pagination', async () => {
      const messages = await Message.findChatMessages(chat._id, 10, 0);

      expect(messages).toHaveLength(2); // Excludes deleted message
      expect(messages[0].content).toBe('Second message'); // Most recent first
      expect(messages[1].content).toBe('First message');
    });

    it('should find messages after timestamp', async () => {
      const timestamp = message1.createdAt;
      const messages = await Message.findMessagesAfter(chat._id, timestamp);

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Second message');
    });

    it('should count unread messages for user', async () => {
      const unreadCount = await Message.countUnreadMessages(chat._id, user1._id);

      expect(unreadCount).toBe(1); // message2 is unread by user1
    });

    it('should mark messages as read', async () => {
      await Message.markAsRead(chat._id, user1._id);

      const unreadCount = await Message.countUnreadMessages(chat._id, user1._id);
      expect(unreadCount).toBe(0);

      // Check that message2 is now marked as read by user1
      const updatedMessage = await Message.findById(message2._id);
      expect(updatedMessage.readBy).toHaveLength(1);
      expect(updatedMessage.readBy[0].user.toString()).toBe(user1._id.toString());
    });

    it('should mark specific messages as read', async () => {
      await Message.markAsRead(chat._id, user1._id, [message2._id]);

      const updatedMessage = await Message.findById(message2._id);
      expect(updatedMessage.readBy).toHaveLength(1);
      expect(updatedMessage.readBy[0].user.toString()).toBe(user1._id.toString());
    });
  });

  describe('Message Instance Methods', () => {
    let message;

    beforeEach(async () => {
      message = new Message({
        chatId: chat._id,
        sender: user1._id,
        content: 'Test message'
      });
      await message.save();
    });

    it('should mark message as read by user', async () => {
      await message.markAsReadBy(user2._id);

      expect(message.readBy).toHaveLength(1);
      expect(message.readBy[0].user.toString()).toBe(user2._id.toString());
      expect(message.readBy[0].readAt).toBeDefined();
    });

    it('should not duplicate read receipts', async () => {
      await message.markAsReadBy(user2._id);
      await message.markAsReadBy(user2._id);

      expect(message.readBy).toHaveLength(1);
    });

    it('should check if message is read by user', async () => {
      expect(message.isReadBy(user2._id)).toBe(false);

      await message.markAsReadBy(user2._id);

      expect(message.isReadBy(user2._id)).toBe(true);
    });

    it('should soft delete message', async () => {
      await message.softDelete();

      expect(message.isDeleted).toBe(true);
      expect(message.deletedAt).toBeDefined();
    });

    it('should edit message content', async () => {
      const newContent = 'Edited message';
      await message.editContent(newContent);

      expect(message.content).toBe(newContent);
      expect(message.editedAt).toBeDefined();
    });

    it('should set editedAt timestamp when content is modified', async () => {
      const originalEditedAt = message.editedAt;
      
      message.content = 'Modified content';
      await message.save();

      expect(message.editedAt).toBeDefined();
      expect(message.editedAt).not.toBe(originalEditedAt);
    });
  });

  describe('Message Virtuals and JSON', () => {
    it('should include virtual fields in JSON output', async () => {
      const message = new Message({
        chatId: chat._id,
        sender: user1._id,
        content: 'Test message'
      });
      await message.save();

      await message.markAsReadBy(user2._id);

      const messageJSON = message.toJSON();

      expect(messageJSON).toHaveProperty('isEdited');
      expect(messageJSON).toHaveProperty('readCount');
      expect(messageJSON.readCount).toBe(1);
      expect(messageJSON.isEdited).toBe(false);
    });

    it('should show isEdited as true when message is edited', async () => {
      const message = new Message({
        chatId: chat._id,
        sender: user1._id,
        content: 'Test message'
      });
      await message.save();

      await message.editContent('Edited content');

      const messageJSON = message.toJSON();
      expect(messageJSON.isEdited).toBe(true);
    });
  });

  describe('Message Reply Functionality', () => {
    it('should create message with reply reference', async () => {
      const originalMessage = new Message({
        chatId: chat._id,
        sender: user1._id,
        content: 'Original message'
      });
      await originalMessage.save();

      const replyMessage = new Message({
        chatId: chat._id,
        sender: user2._id,
        content: 'Reply message',
        replyTo: originalMessage._id
      });
      await replyMessage.save();

      expect(replyMessage.replyTo.toString()).toBe(originalMessage._id.toString());
    });
  });
});