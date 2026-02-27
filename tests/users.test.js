const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

describe('User Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    const mongoose = require('mongoose');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/du_erp_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    
    // Create and login test user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'user@test.com',
        password: 'password123',
        role: 'student',
        department: null
      });

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
    testUser = await User.findOne({ email: 'user@test.com' });
  });

  describe('GET /api/v1/users/profile', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name');
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          phone: '1234567890'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should not update email directly', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@test.com'
        });

      expect(response.status).toBe(200);
      // Email should not change
      const user = await User.findById(testUser._id);
      expect(user.email).toBe('user@test.com');
    });
  });

  describe('PUT /api/v1/users/password', () => {
    it('should change password with correct old password', async () => {
      const response = await request(app)
        .put('/api/v1/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
    });

    it('should not change password with wrong old password', async () => {
      const response = await request(app)
        .put('/api/v1/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
    });
  });
});
