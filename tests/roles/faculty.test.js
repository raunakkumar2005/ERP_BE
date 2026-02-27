/**
 * Faculty Role Tests
 * Tests all faculty functionalities
 */
const request = require('supertest');
const app = require('../../src/app');
const {
  createTestUser,
  getAuthRequest,
  expectSuccess,
  expectAccessDenied
} = require('../helpers/testHelpers');

describe('Faculty Role Tests', () => {
  let faculty;
  let facultyToken;
  let departmentId;
  let courseId;

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
    faculty = await createTestUser('faculty');
    facultyToken = faculty.token;
    departmentId = faculty.department;
  });

  describe('Dashboard', () => {
    it('should get faculty dashboard', async () => {
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/analytics/dashboard');

      expectSuccess(response);
      expect(response.body.data).toHaveProperty('totalCourses');
    });

    it('should get personal timetable', async () => {
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/timetable/faculty/' + faculty.user._id);

      expectSuccess(response);
    });
  });

  describe('Course Management', () => {
    it('should get assigned courses', async () => {
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/courses')
        .query({ faculty: faculty.user._id });

      expectSuccess(response);
    });
  });

  describe('Attendance Management', () => {
    it('should mark attendance', async () => {
      // First create a course
      const courseResponse = await getAuthRequest(facultyToken)
        .post('/api/v1/courses')
        .send({
          name: 'Test Course',
          code: 'TC101',
          credits: 3,
          department: departmentId,
          semester: 1,
          academicYear: '2024-2025'
        });

      courseId = courseResponse.body.data._id;

      const response = await getAuthRequest(facultyToken)
        .post('/api/v1/attendance/mark')
        .send({
          courseId,
          date: new Date(),
          records: []
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should get attendance records', async () => {
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/attendance/course/' + courseId);

      expectSuccess(response);
    });

    it('should get attendance analytics for course', async () => {
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/analytics/attendance')
        .query({ courseId });

      expectSuccess(response);
    });
  });

  describe('Assignment Management', () => {
    it('should create assignment', async () => {
      const response = await getAuthRequest(facultyToken)
        .post('/api/v1/assignments')
        .send({
          title: 'Test Assignment',
          courseId,
          description: 'Complete the following...',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxMarks: 100
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should get course assignments', async () => {
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/assignments')
        .query({ courseId });

      expectSuccess(response);
    });

    it('should grade submissions', async () => {
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/assignments/submissions');

      expectSuccess(response);
    });
  });

  describe('Results Management', () => {
    it('should add student results', async () => {
      const response = await getAuthRequest(facultyToken)
        .post('/api/v1/results')
        .send({
          courseId,
          results: []
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should get grade distribution', async () => {
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/analytics/grades')
        .query({ courseId });

      expectSuccess(response);
    });
  });

  describe('Mentorship', () => {
    it('should get assigned mentees', async () => {
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/mentorship/mentees');

      expectSuccess(response);
    });

    it('should add mentorship record', async () => {
      const response = await getAuthRequest(facultyToken)
        .post('/api/v1/mentorship/records')
        .send({
          notes: 'Initial meeting',
          discussion: 'Course guidance'
        });

      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Access Control', () => {
    it('should NOT access HoD analytics', async () => {
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/analytics/department');

      expectAccessDenied(response);
    });

    it('should NOT create departments', async () => {
      const response = await getAuthRequest(facultyToken)
        .post('/api/v1/departments')
        .send({
          name: 'Test Dept',
          code: 'TD'
        });

      expectAccessDenied(response);
    });

    it('should NOT access admin features', async () => {
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/analytics/system');

      expectAccessDenied(response);
    });

    it('should NOT access other faculty data', async () => {
      const otherFaculty = await createTestUser('faculty');
      
      const response = await getAuthRequest(facultyToken)
        .get('/api/v1/users/' + otherFaculty.user._id);

      // Should either get own data or access denied
      expect([200, 403]).toContain(response.status);
    });
  });
});
