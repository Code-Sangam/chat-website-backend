const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

describe('User Endpoints', () => {
  let authToken;
  let currentUser;
  let testUsers = [];

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  beforeEach(async () => {
    // Clear users collection
    await User.deleteMany({});
    testUsers = [];

    // Create current user and get auth token
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'currentuser',
        email: 'current@example.com',
        password: 'Password123!',
        uniqueUserId: 'CURRENT1'
      });

    authToken = signupResponse.body.data.token;
    currentUser = signupResponse.body.data.user;

    // Create test users for search
    const userPromises = [
      { username: 'testuser1', email: 'test1@example.com', password: 'Password123!', uniqueUserId: 'TEST001' },
      { username: 'testuser2', email: 'test2@example.com', password: 'Password123!', uniqueUserId: 'TEST002' },
      { username: 'searchuser', email: 'search@example.com', password: 'Password123!', uniqueUserId: 'SEARCH1' }
    ].map(async (userData) => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);
      return response.body.data.user;
    });

    const createdUsers = await Promise.all(userPromises);
    testUsers = createdUsers;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/users/search/:userId', () => {
    it('should find user by exact unique ID match', async () => {
      const targetUser = testUsers[0];
      
      const response = await request(app)
        .get(`/api/users/search/${targetUser.uniqueUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User found');
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].uniqueUserId).toBe(targetUser.uniqueUserId);
      expect(response.body.data.users[0].username).toBe(targetUser.username);
      expect(response.body.data.resultCount).toBe(1);
    });

    it('should find user by case-insensitive unique ID', async () => {
      const targetUser = testUsers[0];
      const lowerCaseId = targetUser.uniqueUserId.toLowerCase();
      
      const response = await request(app)
        .get(`/api/users/search/${lowerCaseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].uniqueUserId).toBe(targetUser.uniqueUserId);
    });

    it('should find users by partial unique ID match', async () => {
      const targetUser = testUsers[0];
      const partialId = targetUser.uniqueUserId.substring(0, 3);
      
      const response = await request(app)
        .get(`/api/users/search/${partialId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.resultCount).toBeGreaterThanOrEqual(1);
      
      // Check that at least one result matches our target user
      const foundUser = response.body.data.users.find(
        user => user.uniqueUserId === targetUser.uniqueUserId
      );
      expect(foundUser).toBeTruthy();
    });

    it('should not return current user in search results', async () => {
      const response = await request(app)
        .get(`/api/users/search/${currentUser.uniqueUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.data.resultCount).toBe(0);
    });

    it('should return empty results for non-existent user ID', async () => {
      const response = await request(app)
        .get('/api/users/search/NONEXIST')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Found 0 user(s)');
      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.data.resultCount).toBe(0);
    });

    it('should return error for empty search term', async () => {
      const response = await request(app)
        .get('/api/users/search/%20') // URL-encoded space
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SEARCH_TERM');
      expect(response.body.error.message).toBe('Search term is required');
    });

    it('should return error for search term too long', async () => {
      const response = await request(app)
        .get('/api/users/search/TOOLONGID123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SEARCH_TERM');
      expect(response.body.error.message).toContain('cannot exceed 8 characters');
    });

    it('should return error for search term with invalid characters', async () => {
      const response = await request(app)
        .get('/api/users/search/ABC@123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SEARCH_TERM');
      expect(response.body.error.message).toContain('letters and numbers');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/search/ABC123')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should return user data without sensitive information', async () => {
      const targetUser = testUsers[0];
      
      const response = await request(app)
        .get(`/api/users/search/${targetUser.uniqueUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const foundUser = response.body.data.users[0];
      expect(foundUser).toHaveProperty('id');
      expect(foundUser).toHaveProperty('uniqueUserId');
      expect(foundUser).toHaveProperty('username');
      expect(foundUser).toHaveProperty('isOnline');
      expect(foundUser).toHaveProperty('lastActive');
      expect(foundUser).not.toHaveProperty('email');
      expect(foundUser).not.toHaveProperty('passwordHash');
    });

    it('should limit search results to 10 users', async () => {
      // Create more test users with similar IDs
      const userPromises = [];
      for (let i = 0; i < 15; i++) {
        userPromises.push(
          request(app)
            .post('/api/auth/signup')
            .send({
              username: `bulkuser${i}`,
              email: `bulk${i}@example.com`,
              password: 'Password123'
            })
        );
      }
      await Promise.all(userPromises);

      // Search with a common pattern that should match many users
      const response = await request(app)
        .get('/api/users/search/A') // Assuming many IDs start with A
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.users.length).toBeLessThanOrEqual(10);
      if (response.body.data.users.length === 10) {
        expect(response.body.data.hasMore).toBe(true);
      }
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(currentUser.id);
      expect(response.body.data.user.uniqueUserId).toBe(currentUser.uniqueUserId);
      expect(response.body.data.user.username).toBe(currentUser.username);
      expect(response.body.data.user.email).toBe(currentUser.email);
      expect(response.body.data.user).toHaveProperty('createdAt');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update username successfully', async () => {
      const newUsername = 'updateduser';
      
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ username: newUsername })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.username).toBe(newUsername);
      expect(response.body.data.user).toHaveProperty('updatedAt');
    });

    it('should return error for duplicate username', async () => {
      const existingUsername = testUsers[0].username;
      
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ username: existingUsername })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USERNAME_TAKEN');
    });

    it('should return validation error for invalid username', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ username: 'ab' }) // Too short
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for username with invalid characters', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ username: 'user@name!' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ username: 'newusername' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should handle empty update gracefully', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(currentUser.username);
    });
  });
});