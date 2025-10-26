const mongoose = require('mongoose');
const Chat = require('../../src/models/Chat');
const User = require('../../src/models/User');

describe('Chat Model', () => {
  let user1, user2, user3;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  beforeEach(async () => {
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

    user3 = new User({
      username: 'user3',
      email: 'user3@example.com',
      passwordHash: 'Password123'
    });
    await user3.save();
  });

  afterAll(async () => {
    await Chat.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Chat Creation', () => {
    it('should create a chat with valid participants', async () => {
      const chat = new Chat({
        participants: [user1._id, user2._id]
      });

      const savedChat = await chat.save();

      expect(savedChat.participants).toHaveLength(2);
      expect(savedChat.participants[0].toString()).toBe(user1._id.toString());
      expect(savedChat.participants[1].toString()).toBe(user2._id.toString());
      expect(savedChat.isActive).toBe(true);
      expect(savedChat.createdAt).toBeDefined();
    });

    it('should require exactly 2 participants', async () => {
      const chatWithOneParticipant = new Chat({
        participants: [user1._id]
      });

      await expect(chatWithOneParticipant.save()).rejects.toThrow('Chat must have exactly 2 participants');

      const chatWithThreeParticipants = new Chat({
        participants: [user1._id, user2._id, user3._id]
      });

      await expect(chatWithThreeParticipants.save()).rejects.toThrow('Chat must have exactly 2 participants');
    });

    it('should require unique participants', async () => {
      const chat = new Chat({
        participants: [user1._id, user1._id]
      });

      await expect(chat.save()).rejects.toThrow('Chat participants must be unique');
    });
  });

  describe('Chat Static Methods', () => {
    let chat;

    beforeEach(async () => {
      chat = new Chat({
        participants: [user1._id, user2._id]
      });
      await chat.save();
    });

    it('should find chat between two users', async () => {
      const foundChat = await Chat.findChatBetweenUsers(user1._id, user2._id);

      expect(foundChat).toBeTruthy();
      expect(foundChat._id.toString()).toBe(chat._id.toString());
      expect(foundChat.participants).toHaveLength(2);
    });

    it('should find chat regardless of participant order', async () => {
      const foundChat = await Chat.findChatBetweenUsers(user2._id, user1._id);

      expect(foundChat).toBeTruthy();
      expect(foundChat._id.toString()).toBe(chat._id.toString());
    });

    it('should return null if no chat exists between users', async () => {
      const foundChat = await Chat.findChatBetweenUsers(user1._id, user3._id);

      expect(foundChat).toBeNull();
    });

    it('should find all chats for a user', async () => {
      // Create another chat
      const chat2 = new Chat({
        participants: [user1._id, user3._id]
      });
      await chat2.save();

      const userChats = await Chat.findUserChats(user1._id);

      expect(userChats).toHaveLength(2);
      expect(userChats[0].participants).toBeDefined();
    });

    it('should create new chat if none exists', async () => {
      const newChat = await Chat.createOrGetChat(user1._id, user3._id);

      expect(newChat).toBeTruthy();
      expect(newChat.participants).toHaveLength(2);
      expect(newChat.isActive).toBe(true);

      // Verify it was saved to database
      const foundChat = await Chat.findById(newChat._id);
      expect(foundChat).toBeTruthy();
    });

    it('should return existing chat if one exists', async () => {
      const existingChat = await Chat.createOrGetChat(user1._id, user2._id);

      expect(existingChat._id.toString()).toBe(chat._id.toString());
    });
  });

  describe('Chat Instance Methods', () => {
    let chat;

    beforeEach(async () => {
      chat = new Chat({
        participants: [user1._id, user2._id]
      });
      await chat.save();
    });

    it('should update last message', async () => {
      const messageData = {
        content: 'Hello world',
        sender: user1._id,
        timestamp: new Date(),
        messageType: 'text'
      };

      await chat.updateLastMessage(messageData);

      expect(chat.lastMessage.content).toBe(messageData.content);
      expect(chat.lastMessage.sender.toString()).toBe(user1._id.toString());
      expect(chat.lastMessage.messageType).toBe('text');
    });

    it('should get other participant', async () => {
      await chat.populate('participants');
      
      const otherParticipant = chat.getOtherParticipant(user1._id);

      expect(otherParticipant._id.toString()).toBe(user2._id.toString());
    });

    it('should check if user is participant', async () => {
      expect(chat.isParticipant(user1._id)).toBe(true);
      expect(chat.isParticipant(user2._id)).toBe(true);
      expect(chat.isParticipant(user3._id)).toBe(false);
    });
  });

  describe('Chat JSON Serialization', () => {
    it('should include computed fields in JSON output', async () => {
      const chat = new Chat({
        participants: [user1._id, user2._id]
      });
      await chat.save();

      const chatJSON = chat.toJSON();

      expect(chatJSON).toHaveProperty('participantCount');
      expect(chatJSON.participantCount).toBe(2);
    });
  });
});