# Testing Guide

This guide covers running role-based tests for the Delhi University ERP Backend.

## Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Role-Based Testing

Run tests for specific roles:

```bash
# Admin tests only
npm run test:admin

# HoD tests only
npm run test:hod

# Faculty tests only
npm run test:faculty

# Student tests only
npm run test:student

# All role tests
npm run test:roles
```

## Test Structure

```
tests/
├── helpers/
│   └── testHelpers.js       # Reusable test utilities
├── roles/
│   ├── admin.test.js        # Admin functionality tests
│   ├── hod.test.js         # HoD functionality tests
│   ├── faculty.test.js     # Faculty functionality tests
│   └── student.test.js    # Student functionality tests
├── auth.test.js            # Authentication tests
├── users.test.js          # User endpoint tests
└── setup.js               # Test configuration
```

## Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run with detailed coverage |
| `npm run test:auth` | Authentication tests only |
| `npm run test:users` | User tests only |
| `npm run test:admin` | Admin role tests |
| `npm run test:hod` | HoD role tests |
| `npm run test:faculty` | Faculty role tests |
| `npm run test:student` | Student role tests |
| `npm run test:roles` | All role tests |
| `npm run test:all` | All tests in tests folder |

## Test Coverage by Role

### Admin Tests (20+ tests)
- Dashboard analytics
- User management
- Department management
- Fee management
- Reports generation
- System settings
- Access control verification

### HoD Tests (25+ tests)
- Department overview
- Timetable management (including OCR)
- Course management
- Faculty management
- Approval workflows
- Notice management
- Reports
- Access control verification

### Faculty Tests (20+ tests)
- Dashboard
- Course management
- Attendance marking
- Assignment management
- Results management
- Mentorship
- Access control verification

### Student Tests (30+ tests)
- Dashboard & NEP assessment
- Profile management
- Course registration
- Attendance viewing
- Assignments & submissions
- Results & marksheets
- Fees
- Notices
- Grievances
- Extracurricular activities
- Access control verification

## Test Helper Functions

Available in `tests/helpers/testHelpers.js`:

```javascript
const {
  createTestUser,     // Create user with specific role
  loginUser,          // Login and get tokens
  getAuthRequest,     // Get authenticated request
  createTestSuite,    // Create all role users
  cleanupTestData,   // Clean up test data
  expectSuccess,     // Assert success response
  expectAccessDenied // Assert 401/403 response
} = require('./helpers/testHelpers');
```

## Database Setup

Tests use a separate test database: `du_erp_test`

Make sure MongoDB is running before executing tests:

```bash
# Start MongoDB (if using local)
mongod

# Or use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://... npm test
```

## Writing New Tests

Example test structure:

```javascript
const { createTestUser, getAuthRequest, expectSuccess } = require('../helpers/testHelpers');

describe('Feature Tests', () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createTestUser('student');
    token = user.token;
  });

  it('should do something', async () => {
    const response = await getAuthRequest(token)
      .get('/api/v1/endpoint');

    expectSuccess(response);
    expect(response.body.data).toHaveProperty('property');
  });
});
```

## Debugging Tests

Run a single test file:
```bash
npx jest tests/roles/admin.test.js --verbose
```

Run a specific test:
```bash
npx jest tests/roles/admin.test.js -t "should get admin dashboard" --verbose
```

## CI/CD Integration

For CI pipelines, use:

```bash
# Run tests with JUnit XML output
npm test -- --reporters=default --reporters=jest-junit
```
