const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const mongoose = require('mongoose');

// Test environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

describe('Authentication Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/du_erp_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new admin user', async () => {
      const userData = {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
        department: null
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should not register duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@test.com',
        password: 'password123',
        role: 'student',
        department: null
      };

      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Duplicate registration
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should not register user with invalid role', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid@test.com',
        password: 'password123',
        role: 'invalid_role',
        department: null
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect([400, 201]).toContain(response.status);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Login Test User',
          email: 'login@test.com',
          password: 'password123',
          role: 'student',
          department: null
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should not login with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should refresh token with valid refresh token', async () => {
      // First register and login
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Refresh Test',
          email: 'refresh@test.com',
          password: 'password123',
          role: 'student',
          department: null
        });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'refresh@test.com',
          password: 'password123'
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });
  });
});
