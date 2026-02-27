const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Department = require('../../src/models/Department');

/**
 * Test Helper Utilities for Role-Based Testing
 */

// Create a test user with specific role
async function createTestUser(role, options = {}) {
  const defaultData = {
    admin: {
      name: 'Test Admin',
      email: `admin_${Date.now()}@test.com`,
      password: 'Test@123',
      role: 'admin',
      department: null
    },
    hod: {
      name: 'Test HoD',
      email: `hod_${Date.now()}@test.com`,
      password: 'Test@123',
      role: 'hod',
      department: null
    },
    faculty: {
      name: 'Test Faculty',
      email: `faculty_${Date.now()}@test.com`,
      password: 'Test@123',
      role: 'faculty',
      department: null
    },
    student: {
      name: 'Test Student',
      email: `student_${Date.now()}@test.com`,
      password: 'Test@123',
      role: 'student',
      department: null,
      rollNumber: `STU${Math.floor(Math.random() * 100000)}`,
      semester: 1
    }
  };

  const userData = { ...defaultData[role], ...options };

  // If department is needed, create one
  if (role !== 'admin' && !userData.department) {
    const dept = await Department.create({
      name: 'Test Department',
      code: `TEST${Math.floor(Math.random() * 100)}`,
      head: null
    });
    userData.department = dept._id;
  }

  const response = await request(app)
    .post('/api/v1/auth/register')
    .send(userData);

  if (response.status === 201) {
    return {
      user: response.body.data.user,
      token: response.body.data.token,
      ...userData
    };
  }

  throw new Error(`Failed to create ${role} user: ${response.body.error}`);
}

// Login and get tokens
async function loginUser(email, password) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  if (response.status === 200) {
    return {
      token: response.body.data.token,
      refreshToken: response.body.data.refreshToken,
      user: response.body.data.user
    };
  }

  throw new Error(`Login failed: ${response.body.error}`);
}

// Get authenticated request with token
function getAuthRequest(token) {
  return request(app)
    .set('Authorization', `Bearer ${token}`);
}

// Create multiple users of different roles
async function createTestSuite() {
  const admin = await createTestUser('admin');
  const hod = await createTestUser('hod', { department: admin.user.department });
  const faculty = await createTestUser('faculty', { department: hod.department });
  const student = await createTestUser('student', { department: hod.department });

  return { admin, hod, faculty, student };
}

// Clean up test data
async function cleanupTestData() {
  await User.deleteMany({ email: { $regex: /@test\.com$/ } });
  await Department.deleteMany({ code: { $regex: /^TEST/ } });
}

// Test helper for checking access denied
async function expectAccessDenied(promise) {
  const response = await promise;
  expect([401, 403]).toContain(response.status);
  return response;
}

// Test helper for checking success
async function expectSuccess(promise, expectedStatus = 200) {
  const response = await promise;
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(true);
  return response;
}

// Test helper for checking validation error
async function expectValidationError(promise) {
  const response = await promise;
  expect(response.status).toBe(400);
  return response;
}

module.exports = {
  createTestUser,
  loginUser,
  getAuthRequest,
  createTestSuite,
  cleanupTestData,
  expectAccessDenied,
  expectSuccess,
  expectValidationError
};
