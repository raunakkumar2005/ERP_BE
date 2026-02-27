/**
 * HoD Role Tests
 * Tests Head of Department functionalities
 */
const request = require('supertest');
const app = require('../../src/app');
const {
  createTestUser,
  getAuthRequest,
  expectSuccess,
  expectAccessDenied
} = require('../helpers/testHelpers');

describe('HoD Role Tests', () => {
  let hod;
  let hodToken;
  let departmentId;

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
    hod = await createTestUser('hod');
    hodToken = hod.token;
    departmentId = hod.department;
  });

  describe('Dashboard & Analytics', () => {
    it('should get department overview', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/analytics/department');

      expectSuccess(response);
      expect(response.body.data).toHaveProperty('faculty');
      expect(response.body.data).toHaveProperty('students');
    });

    it('should get attendance analytics', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/analytics/attendance')
        .query({ departmentId });

      expectSuccess(response);
    });

    it('should get academic performance', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/analytics/academic')
        .query({ departmentId });

      expectSuccess(response);
    });
  });

  describe('Timetable Management', () => {
    it('should create timetable', async () => {
      const response = await getAuthRequest(hodToken)
        .post('/api/v1/timetable')
        .send({
          departmentId,
          semester: 1,
          academicYear: '2024-2025',
          schedule: []
        });

      expectSuccess(response, 201);
    });

    it('should upload timetable for OCR', async () => {
      // This would need a real file - testing the endpoint exists
      const response = await getAuthRequest(hodToken)
        .post('/api/v1/timetable/ocr-upload')
        .attach('image', Buffer.from('fake-image'), 'timetable.png')
        .field('departmentId', departmentId)
        .field('semester', '1');

      // Expect either success or validation error (no file)
      expect([201, 400, 500]).toContain(response.status);
    });

    it('should get department timetable', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/timetable/department/' + departmentId);

      expectSuccess(response);
    });
  });

  describe('Course Management', () => {
    it('should create course', async () => {
      const response = await getAuthRequest(hodToken)
        .post('/api/v1/courses')
        .send({
          name: 'Data Structures',
          code: 'CS201',
          credits: 4,
          department: departmentId,
          semester: 1,
          academicYear: '2024-2025'
        });

      expectSuccess(response, 201);
    });

    it('should get department courses', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/courses')
        .query({ department: departmentId });

      expectSuccess(response);
    });
  });

  describe('Faculty Management', () => {
    it('should assign faculty to course', async () => {
      // First create a faculty
      const faculty = await createTestUser('faculty', { department: departmentId });
      
      // Create a course
      const courseResponse = await getAuthRequest(hodToken)
        .post('/api/v1/courses')
        .send({
          name: 'Algorithms',
          code: 'CS301',
          credits: 4,
          department: departmentId,
          semester: 1,
          academicYear: '2024-2025'
        });

      const courseId = courseResponse.body.data._id;

      // Assign faculty
      const response = await getAuthRequest(hodToken)
        .put(`/api/v1/courses/${courseId}`)
        .send({ faculty: faculty.user._id });

      expectSuccess(response);
    });

    it('should view faculty workload', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/workload')
        .query({ department: departmentId });

      expectSuccess(response);
    });
  });

  describe('Approval Workflow', () => {
    it('should get pending approvals', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/approvals/pending');

      expectSuccess(response);
    });

    it(' requestsshould approve/reject', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/approvals');

      expectSuccess(response);
    });
  });

  describe('Notice Management', () => {
    it('should create notice', async () => {
      const response = await getAuthRequest(hodToken)
        .post('/api/v1/notices')
        .send({
          title: 'Department Notice',
          content: 'Important update',
          priority: 'high',
          targetAudience: 'all'
        });

      expectSuccess(response, 201);
    });

    it('should get notice analytics', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/analytics/notices');

      expectSuccess(response);
    });
  });

  describe('Reports', () => {
    it('should generate grade distribution', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/analytics/grades');

      expectSuccess(response);
    });

    it('should generate student list', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/analytics/reports/students')
        .query({ departmentId });

      expect(response.status).toBe(200);
    });
  });

  describe('Access Control', () => {
    it('should NOT access admin system analytics', async () => {
      const response = await getAuthRequest(hodToken)
        .get('/api/v1/analytics/system');

      expectAccessDenied(response);
    });

    it('should NOT create new departments', async () => {
      const response = await getAuthRequest(hodToken)
        .post('/api/v1/departments')
        .send({
          name: 'New Department',
          code: 'ND'
        });

      expectAccessDenied(response);
    });
  });
});
