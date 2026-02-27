/**
 * Student Role Tests
 * Tests all student functionalities
 */
const request = require('supertest');
const app = require('../../src/app');
const {
  createTestUser,
  getAuthRequest,
  expectSuccess,
  expectAccessDenied
} = require('../helpers/testHelpers');

describe('Student Role Tests', () => {
  let student;
  let studentToken;
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
    student = await createTestUser('student');
    studentToken = student.token;
    departmentId = student.department;
  });

  describe('Dashboard', () => {
    it('should get student dashboard', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/analytics/dashboard');

      expectSuccess(response);
      expect(response.body.data).toHaveProperty('myCourses');
      expect(response.body.data).toHaveProperty('myAttendance');
    });

    it('should get NEP 2020 assessment', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/analytics/nep');

      expectSuccess(response);
      expect(response.body.data).toHaveProperty('totalNEPPoints');
    });
  });

  describe('Profile Management', () => {
    it('should get own profile', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/users/profile');

      expectSuccess(response);
      expect(response.body.data.email).toBe(student.email);
    });

    it('should update own profile', async () => {
      const response = await getAuthRequest(studentToken)
        .put('/api/v1/users/profile')
        .send({
          phone: '9876543210',
          address: 'Test Address'
        });

      expectSuccess(response);
    });

    it('should change password', async () => {
      const response = await getAuthRequest(studentToken)
        .put('/api/v1/users/password')
        .send({
          oldPassword: 'Test@123',
          newPassword: 'NewTest@123'
        });

      expectSuccess(response);
    });
  });

  describe('Course Registration', () => {
    it('should get available courses', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/registration/courses')
        .query({ semester: 1 });

      expectSuccess(response);
    });

    it('should register for courses', async () => {
      const response = await getAuthRequest(studentToken)
        .post('/api/v1/registration/register')
        .send({
          courses: []
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should view enrolled courses', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/registration/my-courses');

      expectSuccess(response);
    });
  });

  describe('Attendance', () => {
    it('should view own attendance', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/attendance/my');

      expectSuccess(response);
    });

    it('should view attendance by course', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/attendance/my/course/123');

      expectSuccess(response);
    });
  });

  describe('Assignments', () => {
    it('should get available assignments', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/assignments');

      expectSuccess(response);
    });

    it('should get assignment by ID', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/assignments/123');

      expectSuccess(response);
    });

    it('should submit assignment', async () => {
      const response = await getAuthRequest(studentToken)
        .post('/api/v1/assignments/123/submit')
        .send({
          submissionText: 'My answer...'
        });

      expect([201, 400, 404]).toContain(response.status);
    });

    it('should view own submissions', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/assignments/my-submissions');

      expectSuccess(response);
    });
  });

  describe('Results', () => {
    it('should view own results', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/results/my');

      expectSuccess(response);
    });

    it('should view results by semester', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/results/my')
        .query({ semester: 1 });

      expectSuccess(response);
    });

    it('should download marksheet', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/analytics/reports/marksheet')
        .query({ 
          studentId: student.user._id,
          semester: 1,
          academicYear: '2024-2025'
        });

      expect([200, 400]).toContain(response.status);
    });

    it('should download transcript', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/analytics/reports/transcript')
        .query({ studentId: student.user._id });

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Timetable', () => {
    it('should view own timetable', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/timetable/student/' + student.user._id);

      expectSuccess(response);
    });
  });

  describe('Fees', () => {
    it('should view fee structure', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/fees/my');

      expectSuccess(response);
    });

    it('should view fee payment history', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/fees/history');

      expectSuccess(response);
    });

    it('should initiate fee payment', async () => {
      const response = await getAuthRequest(studentToken)
        .post('/api/v1/fees/pay')
        .send({
          feeId: '123',
          paymentMethod: 'online'
        });

      expect([201, 400, 404]).toContain(response.status);
    });
  });

  describe('Notices', () => {
    it('should view notices', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/notices');

      expectSuccess(response);
    });

    it('should view notice by ID', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/notices/123');

      expectSuccess(response);
    });
  });

  describe('Grievances', () => {
    it('should submit grievance', async () => {
      const response = await getAuthRequest(studentToken)
        .post('/api/v1/grievances')
        .send({
          subject: 'Issue with grade',
          description: 'My grade seems incorrect',
          category: 'academic'
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should view own grievances', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/grievances/my');

      expectSuccess(response);
    });

    it('should view grievance by ID', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/grievances/123');

      expectSuccess(response);
    });
  });

  describe('Extracurricular Activities', () => {
    it('should view available activities', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/activities');

      expectSuccess(response);
    });

    it('should register for activity', async () => {
      const response = await getAuthRequest(studentToken)
        .post('/api/v1/activities/register')
        .send({ activityId: '123' });

      expect([201, 400, 404]).toContain(response.status);
    });

    it('should view my activities', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/activities/my');

      expectSuccess(response);
    });
  });

  describe('Access Control', () => {
    it('should NOT create courses', async () => {
      const response = await getAuthRequest(studentToken)
        .post('/api/v1/courses')
        .send({
          name: 'Test',
          code: 'T001'
        });

      expectAccessDenied(response);
    });

    it('should NOT mark attendance', async () => {
      const response = await getAuthRequest(studentToken)
        .post('/api/v1/attendance/mark')
        .send({});

      expectAccessDenied(response);
    });

    it('should NOT access analytics dashboard', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/analytics/academic');

      expectAccessDenied(response);
    });

    it('should NOT access admin features', async () => {
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/analytics/system');

      expectAccessDenied(response);
    });

    it('should NOT view other student data', async () => {
      const otherStudent = await createTestUser('student');
      
      const response = await getAuthRequest(studentToken)
        .get('/api/v1/users/' + otherStudent.user._id);

      expectAccessDenied(response);
    });
  });
});
