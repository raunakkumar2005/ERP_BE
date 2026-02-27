/**
 * Admin Role Tests
 * Tests all admin-only functionalities
 */
const request = require('supertest');
const app = require('../../src/app');
const {
  createTestUser,
  getAuthRequest,
  expectSuccess,
  expectAccessDenied
} = require('../helpers/testHelpers');

describe('Admin Role Tests', () => {
  let admin;
  let adminToken;

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
    admin = await createTestUser('admin');
    adminToken = admin.token;
  });

  describe('Dashboard Analytics', () => {
    it('should get admin dashboard stats', async () => {
      const response = await getAuthRequest(adminToken)
        .get('/api/v1/analytics/dashboard');

      expectSuccess(response);
      expect(response.body.data).toHaveProperty('totalStudents');
      expect(response.body.data).toHaveProperty('totalFaculty');
    });

    it('should get system usage analytics', async () => {
      const response = await getAuthRequest(adminToken)
        .get('/api/v1/analytics/system');

      expectSuccess(response);
      expect(response.body.data).toHaveProperty('activeUsers');
    });
  });

  describe('User Management', () => {
    it('should get all users', async () => {
      const response = await getAuthRequest(adminToken)
        .get('/api/v1/users');

      expectSuccess(response);
    });

    it('should get any user by ID', async () => {
      const student = await createTestUser('student');
      
      const response = await getAuthRequest(adminToken)
        .get(`/api/v1/users/${student.user._id}`);

      expectSuccess(response);
    });

    it('should update any user', async () => {
      const student = await createTestUser('student');
      
      const response = await getAuthRequest(adminToken)
        .put(`/api/v1/users/${student.user._id}`)
        .send({ name: 'Updated by Admin' });

      expectSuccess(response);
    });
  });

  describe('Department Management', () => {
    it('should create department', async () => {
      const response = await getAuthRequest(adminToken)
        .post('/api/v1/departments')
        .send({
          name: 'Computer Science',
          code: 'CS',
          description: 'CS Department'
        });

      expectSuccess(response, 201);
    });

    it('should get all departments', async () => {
      const response = await getAuthRequest(adminToken)
        .get('/api/v1/departments');

      expectSuccess(response);
    });

    it('should delete department', async () => {
      // First create a department
      const createResponse = await getAuthRequest(adminToken)
        .post('/api/v1/departments')
        .send({
          name: 'Test Dept',
          code: 'TD'
        });

      const deptId = createResponse.body.data._id;

      const response = await getAuthRequest(adminToken)
        .delete(`/api/v1/departments/${deptId}`);

      expectSuccess(response);
    });
  });

  describe('Fee Management', () => {
    it('should create fee structure', async () => {
      const response = await getAuthRequest(adminToken)
        .post('/api/v1/fees/structure')
        .send({
          name: 'Semester Fee',
          amount: 50000,
          type: 'semester',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

      expectSuccess(response, 201);
    });

    it('should get fee analytics', async () => {
      const response = await getAuthRequest(adminToken)
        .get('/api/v1/analytics/fees');

      expectSuccess(response);
    });
  });

  describe('Reports Generation', () => {
    it('should generate student list report', async () => {
      const response = await getAuthRequest(adminToken)
        .get('/api/v1/analytics/reports/students');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheet');
    });

    it('should generate fee report', async () => {
      const response = await getAuthRequest(adminToken)
        .get('/api/v1/analytics/reports/fees');

      expect(response.status).toBe(200);
    });

    it('should generate workload report', async () => {
      const response = await getAuthRequest(adminToken)
        .get('/api/v1/analytics/reports/workload')
        .query({ academicYear: '2024-2025' });

      expect(response.status).toBe(200);
    });
  });

  describe('System Settings', () => {
    it('should get approval analytics', async () => {
      const response = await getAuthRequest(adminToken)
        .get('/api/v1/analytics/approvals');

      expectSuccess(response);
    });
  });
});
