const mongoose = require('mongoose');
const User = require('../../src/models/User');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'Password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.uniqueUserId).toHaveLength(8);
      expect(savedUser.uniqueUserId).toMatch(/^[A-Z0-9]{8}$/);
      expect(savedUser.passwordHash).not.toBe(userData.passwordHash); // Should be hashed
      expect(savedUser.isOnline).toBe(false);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should generate unique user IDs for multiple users', async () => {
      const users = [];
      const userIds = new Set();

      for (let i = 0; i < 5; i++) {
        const user = new User({
          username: `testuser${i}`,
          email: `test${i}@example.com`,
          passwordHash: 'Password123'
        });
        const savedUser = await user.save();
        users.push(savedUser);
        userIds.add(savedUser.uniqueUserId);
      }

      // All user IDs should be unique
      expect(userIds.size).toBe(5);
    });

    it('should hash password before saving', async () => {
      const plainPassword = 'Password123';
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: plainPassword
      });

      await user.save();

      expect(user.passwordHash).not.toBe(plainPassword);
      expect(user.passwordHash.length).toBeGreaterThan(50); // bcrypt hash length
    });
  });

  describe('User Validation', () => {
    it('should require username', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: 'Password123'
      });

      await expect(user.save()).rejects.toThrow('Username is required');
    });

    it('should require email', async () => {
      const user = new User({
        username: 'testuser',
        passwordHash: 'Password123'
      });

      await expect(user.save()).rejects.toThrow('Email is required');
    });

    it('should require password', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com'
      });

      await expect(user.save()).rejects.toThrow('Password is required');
    });

    it('should validate email format', async () => {
      const user = new User({
        username: 'testuser',
        email: 'invalid-email',
        passwordHash: 'Password123'
      });

      await expect(user.save()).rejects.toThrow('Please enter a valid email');
    });

    it('should validate username format', async () => {
      const user = new User({
        username: 'test user!', // Invalid characters
        email: 'test@example.com',
        passwordHash: 'Password123'
      });

      await expect(user.save()).rejects.toThrow('Username can only contain letters, numbers, and underscores');
    });

    it('should validate username length', async () => {
      const user = new User({
        username: 'ab', // Too short
        email: 'test@example.com',
        passwordHash: 'Password123'
      });

      await expect(user.save()).rejects.toThrow('Username must be at least 3 characters long');
    });

    it('should enforce unique email', async () => {
      const userData = {
        username: 'testuser1',
        email: 'test@example.com',
        passwordHash: 'Password123'
      };

      // Create first user
      const user1 = new User(userData);
      await user1.save();

      // Try to create second user with same email
      const user2 = new User({
        ...userData,
        username: 'testuser2'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should enforce unique username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test1@example.com',
        passwordHash: 'Password123'
      };

      // Create first user
      const user1 = new User(userData);
      await user1.save();

      // Try to create second user with same username
      const user2 = new User({
        ...userData,
        email: 'test2@example.com'
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'Password123'
      });
      await user.save();
    });

    it('should compare password correctly', async () => {
      const isMatch = await user.comparePassword('Password123');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });

    it('should update last active timestamp', async () => {
      const originalLastActive = user.lastActive;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await user.updateLastActive();
      
      expect(user.lastActive.getTime()).toBeGreaterThan(originalLastActive.getTime());
    });

    it('should set online status', async () => {
      expect(user.isOnline).toBe(false);

      await user.setOnlineStatus(true);
      expect(user.isOnline).toBe(true);

      await user.setOnlineStatus(false);
      expect(user.isOnline).toBe(false);
    });

    it('should update last active when setting online status to true', async () => {
      const originalLastActive = user.lastActive;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await user.setOnlineStatus(true);
      
      expect(user.lastActive.getTime()).toBeGreaterThan(originalLastActive.getTime());
    });
  });

  describe('User Static Methods', () => {
    beforeEach(async () => {
      // Create test users
      const users = [
        { username: 'user1', email: 'user1@example.com', passwordHash: 'Password123!', uniqueUserId: 'USER001' },
        { username: 'user2', email: 'user2@example.com', passwordHash: 'Password123!', uniqueUserId: 'USER002' },
        { username: 'user3', email: 'user3@example.com', passwordHash: 'Password123!', uniqueUserId: 'USER003' }
      ];

      for (const userData of users) {
        const user = new User(userData);
        await user.save();
      }
    });

    it('should find user by unique ID', async () => {
      const users = await User.find();
      const testUser = users[0];

      const foundUser = await User.findByUniqueId(testUser.uniqueUserId);
      expect(foundUser).toBeTruthy();
      expect(foundUser._id.toString()).toBe(testUser._id.toString());

      // Should work with lowercase input
      const foundUserLower = await User.findByUniqueId(testUser.uniqueUserId.toLowerCase());
      expect(foundUserLower).toBeTruthy();
    });

    it('should search users by unique ID pattern', async () => {
      const users = await User.find();
      const testUser = users[0];
      const searchTerm = testUser.uniqueUserId.substring(0, 3);

      const searchResults = await User.searchByUniqueId(searchTerm);
      expect(searchResults.length).toBeGreaterThan(0);
      
      // Should only return specific fields
      const result = searchResults[0];
      expect(result).toHaveProperty('uniqueUserId');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('isOnline');
      expect(result).toHaveProperty('lastActive');
      
      // Convert to plain object to check excluded fields
      const plainResult = result.toObject();
      expect(plainResult).not.toHaveProperty('passwordHash');
      expect(plainResult).not.toHaveProperty('email');
    });
  });

  describe('User JSON Serialization', () => {
    it('should exclude sensitive data from JSON output', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'Password123'
      });
      await user.save();

      const userJSON = user.toJSON();

      expect(userJSON).toHaveProperty('username');
      expect(userJSON).toHaveProperty('email');
      expect(userJSON).toHaveProperty('uniqueUserId');
      expect(userJSON).not.toHaveProperty('passwordHash');
      expect(userJSON).not.toHaveProperty('__v');
    });
  });
});