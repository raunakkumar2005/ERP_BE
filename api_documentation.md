# Delhi University ERP System - Complete API Documentation

## Overview
This document provides comprehensive documentation for the Delhi University College Management ERP system API, designed for 4 user roles (Admin, Faculty, Student, HoD) with NEP 2020 compliance.

## Base Configuration
- **Base URL**: `https://api.du-erp.edu.in/v1`
- **Authentication**: JWT Bearer tokens
- **Rate Limiting**: 1000 requests/hour per user
- **Response Format**: JSON
- **Date Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- **File Upload**: multipart/form-data for file endpoints

## Authentication

### JWT Token Structure
```json
{
  "id": "user_id",
  "email": "user_email",
  "role": "user_role",
  "department": "department_id",
  "iat": 1677334800,
  "exp": 1677421200
}
```

### Authentication Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, department management, all reports |
| **HoD** | Department management, faculty management, approvals, department reports |
| **Faculty** | Course management, attendance, assignments, results, mentorship |
| **Student** | Personal academic data, course enrollment, assignments, extracurricular activities |

## Core Data Models

### User
```json
{
  "id": "string (ObjectId)",
  "name": "string",
  "email": "string (unique)",
  "role": "enum: [admin, faculty, student, hod]",
  "avatar": "string (URL, optional)",
  "department": "string (ObjectId)",
  "employeeId": "string (optional)",
  "studentId": "string (optional)",
  "phone": "string",
  "bio": "string",
  "qualifications": "array (string) - for faculty",
  "specializations": "array (string) - for faculty",
  "experience": "string - for faculty",
  "semester": "string - for students",
  "section": "string - for students",
  "cgpa": "number - for students",
  "skills": "array (string) - for students",
  "projects": "array (string) - for students",
  "isActive": "boolean",
  "lastLogin": "datetime",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Department
```json
{
  "id": "string (ObjectId)",
  "name": "string",
  "code": "string (unique)",
  "hodId": "string (ObjectId)",
  "hodName": "string",
  "facultyCount": "number",
  "studentCount": "number",
  "isActive": "boolean"
}
```

### Course
```json
{
  "id": "string (ObjectId)",
  "name": "string",
  "code": "string (unique)",
  "semester": "string",
  "students": "number",
  "schedule": "string",
  "room": "string",
  "status": "enum: [active, upcoming, completed]",
  "faculty": "string (ObjectId)",
  "facultyName": "string",
  "description": "string",
  "credits": "number",
  "type": "enum: [core, elective, multidisciplinary, skill-based]",
  "department": "string (ObjectId)",
  "maxCapacity": "number",
  "enrolledStudents": "array (ObjectId)",
  "waitlist": "array (WaitlistEntry)"
}
```

### WaitlistEntry
```json
{
  "student": "string (ObjectId)",
  "position": "number",
  "addedAt": "datetime"
}
```

### Notice
```json
{
  "id": "string (ObjectId)",
  "title": "string",
  "content": "string",
  "createdBy": "string (ObjectId)",
  "createdAt": "datetime",
  "targetRoles": "array (UserRole)",
  "priority": "enum: [low, medium, high]",
  "isRead": "boolean",
  "readBy": "array (ReadEntry)"
}
```

### ReadEntry
```json
{
  "user": "string (ObjectId)"
}
```

### Attendance
```json
{
  "id": "string (ObjectId)",
  "studentId": "string (ObjectId)",
  "courseId": "string (ObjectId)",
  "date": "date",
  "status": "enum: [present, absent, late]",
  "markedBy": "string (ObjectId)",
  "notes": "string"
}
```

### Assignment
```json
{
  "id": "string (ObjectId)",
  "title": "string",
  "courseId": "string (ObjectId)",
  "courseName": "string",
  "description": "string",
  "dueDate": "datetime",
  "maxMarks": "number",
  "submittedCount": "number",
  "totalStudents": "number",
  "status": "enum: [active, closed]",
  "facultyId": "string (ObjectId)",
  "attachments": "array (string)",
  "instructions": "string"
}
```

### AssignmentSubmission
```json
{
  "id": "string (ObjectId)",
  "assignmentId": "string (ObjectId)",
  "studentId": "string (ObjectId)",
  "studentName": "string",
  "submittedAt": "datetime",
  "fileUrl": "string",
  "marks": "number (optional)",
  "feedback": "string (optional)",
  "status": "enum: [submitted, graded, late]"
}
```

### FeeStructure
```json
{
  "id": "string (ObjectId)",
  "type": "enum: [tuition, library, laboratory, examination, development, sports, other]",
  "name": "string",
  "amount": "number",
  "description": "string",
  "isOptional": "boolean",
  "dueDate": "date",
  "semester": "string"
}
```

### FeePayment
```json
{
  "id": "string (ObjectId)",
  "studentId": "string (ObjectId)",
  "feeStructureId": "string (ObjectId)",
  "amount": "number",
  "paidAmount": "number",
  "paymentDate": "datetime",
  "transactionId": "string",
  "paymentMethod": "enum: [card, netbanking, upi, cash, cheque]",
  "status": "enum: [pending, paid, failed, refunded, partial]",
  "receiptUrl": "string (optional)",
  "semester": "string"
}
```

### Grievance
```json
{
  "id": "string (ObjectId)",
  "studentId": "string (ObjectId)",
  "category": "enum: [academic, administrative, technical, hostel, other]",
  "subject": "string",
  "description": "string",
  "priority": "enum: [low, medium, high]",
  "status": "enum: [submitted, in-progress, resolved, closed]",
  "assignedTo": "string (ObjectId, optional)",
  "attachments": "array (string)",
  "resolution": "string (optional)",
  "createdAt": "datetime",
  "resolvedAt": "datetime (optional)"
}
```

### ExtracurricularActivity
```json
{
  "id": "string (ObjectId)",
  "studentId": "string (ObjectId)",
  "activityType": "enum: [sports, cultural, technical, social, academic]",
  "title": "string",
  "description": "string",
  "organizingBody": "string",
  "participationType": "enum: [participant, organizer, winner, volunteer]",
  "startDate": "date",
  "endDate": "date",
  "hoursInvolved": "number",
  "certificateUrl": "string (optional)",
  "skillsGained": "array (string)",
  "nepPoints": "number",
  "verificationStatus": "enum: [pending, verified, rejected]",
  "verifiedBy": "string (ObjectId, optional)"
}
```

### Timetable
```json
{
  "id": "string (ObjectId)",
  "departmentId": "string (ObjectId)",
  "semester": "number",
  "academicYear": "string",
  "schedule": "array (TimetableSlot)",
  "createdBy": "string (ObjectId)",
  "status": "enum: [draft, approved, published]",
  "ocrProcessed": "boolean",
  "googleCalendarSynced": "boolean"
}
```

### TimetableSlot
```json
{
  "id": "string (ObjectId)",
  "courseId": "string (ObjectId)",
  "courseName": "string",
  "courseCode": "string",
  "facultyId": "string (ObjectId)",
  "facultyName": "string",
  "day": "enum: [monday, tuesday, wednesday, thursday, friday, saturday]",
  "startTime": "time",
  "endTime": "time",
  "room": "string",
  "type": "enum: [lecture, practical, tutorial]"
}
```

### MentorshipRecord
```json
{
  "id": "string (ObjectId)",
  "mentorId": "string (ObjectId)",
  "mentorName": "string",
  "menteeId": "string (ObjectId)",
  "menteeName": "string",
  "assignedDate": "date",
  "status": "enum: [active, completed, transferred]",
  "meetingSchedule": "string",
  "sessions": "array (MentorshipSession)",
  "goals": "array (string)",
  "notes": "string"
}
```

### MentorshipSession
```json
{
  "id": "string (ObjectId)",
  "date": "datetime",
  "duration": "number (minutes)",
  "type": "enum: [academic, career, personal, general]",
  "topics": "array (string)",
  "outcomes": "string",
  "nextSteps": "string",
  "studentFeedback": "object (rating/comments)"
}
```

### WorkloadAllocation
```json
{
  "id": "string (ObjectId)",
  "facultyId": "string (ObjectId)",
  "facultyName": "string",
  "academicYear": "string",
  "semester": "number",
  "courses": "array (CourseLoad)",
  "totalHours": "number",
  "maxHours": "number",
  "additionalDuties": "array (string)",
  "status": "enum: [draft, approved, published]",
  "approvedBy": "string (ObjectId, optional)",
  "createdBy": "string (ObjectId)"
}
```

### CourseLoad
```json
{
  "courseId": "string (ObjectId)",
  "courseName": "string",
  "hoursPerWeek": "number",
  "studentCount": "number",
  "courseType": "enum: [theory, practical, tutorial]"
}
```

### ApprovalRequest
```json
{
  "id": "string (ObjectId)",
  "type": "enum: [course_change, faculty_leave, budget_request, timetable_change, student_grievance]",
  "requesterId": "string (ObjectId)",
  "requesterName": "string",
  "title": "string",
  "description": "string",
  "priority": "enum: [low, medium, high, urgent]",
  "status": "enum: [pending, approved, rejected, escalated]",
  "approverLevel": "enum: [hod, admin]",
  "currentApprover": "string (ObjectId)",
  "approvalHistory": "array (ApprovalAction)",
  "attachments": "array (string)",
  "deadline": "datetime",
  "createdAt": "datetime"
}
```

### ApprovalAction
```json
{
  "userId": "string (ObjectId)",
  "userName": "string",
  "action": "enum: [approved, rejected, requested_changes]",
  "timestamp": "datetime",
  "comments": "string"
}
```

### StudentResult
```json
{
  "id": "string (ObjectId)",
  "studentId": "string (ObjectId)",
  "courseId": "string (ObjectId)",
  "courseName": "string",
  "courseCode": "string",
  "academicYear": "string",
  "semester": "number",
  "totalMarks": "number",
  "obtainedMarks": "number",
  "grade": "string",
  "gradePoint": "number",
  "status": "enum: [pass, fail, pending]",
  "evaluatedBy": "string (ObjectId)",
  "evaluatedDate": "datetime",
  "remarks": "string"
}
```

---

## API Endpoints

### 1. Authentication

#### POST `/auth/login`
Login user with credentials

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (min 6 chars, required)",
  "rememberMe": "boolean (optional, default: false)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": "User object",
    "token": "string (JWT)",
    "refreshToken": "string",
    "expiresIn": "number (seconds)"
  }
}
```

**Error Responses:**
- 401: Invalid credentials
- 401: Account deactivated

#### POST `/auth/register`
Register new user (Admin only)

**Request Body:**
```json
{
  "email": "string (email, required)",
  "password": "string (min 6 chars, required)",
  "role": "enum: [admin, faculty, student, hod] (required)",
  "name": "string (min 2, max 100, required)",
  "department": "string (optional)",
  "phone": "string (10-15 digits, optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": "User object",
    "token": "string (JWT)",
    "refreshToken": "string",
    "expiresIn": "number",
    "message": "User registered successfully"
  }
}
```

**Error Responses:**
- 409: User already exists

#### POST `/auth/forgot-password`
Request password reset

**Request Body:**
```json
{
  "email": "string (email, required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

#### POST `/auth/reset-password`
Reset password with token

**Request Body:**
```json
{
  "token": "string (required)",
  "newPassword": "string (min 6 chars, required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successful"
  }
}
```

#### POST `/auth/refresh-token`
Refresh JWT token

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "string (JWT)",
    "expiresIn": "number (seconds)"
  }
}
```

**Error Responses:**
- 401: Invalid or expired refresh token

#### POST `/auth/logout`
Logout user (invalidate tokens)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### 2. User Management

#### GET `/users/profile`
Get current user profile

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "User object"
}
```

#### PUT `/users/profile`
Update current user profile

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "name": "string (min 2, max 100)",
  "phone": "string (10-15 digits)",
  "avatar": "string (URL)",
  "bio": "string (max 500)",
  "qualifications": "array (string)",
  "specializations": "array (string)",
  "experience": "string",
  "semester": "string",
  "section": "string",
  "skills": "array (string)",
  "projects": "array (string)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated User object"
}
```

#### GET `/users/public-profile/:userId`
Get public profile for sharing

**Response (200 OK):**
```json
{
  "success": true,
  "data": "User public profile object"
}
```

#### POST `/users/generate-qr`
Generate QR code for profile sharing

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "qrCodeUrl": "string (base64 data URL)"
  }
}
```

#### GET `/users/:id`
Get user by ID (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "User object"
}
```

**Error Responses:**
- 404: User not found

#### PUT `/users/:id`
Update user (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string (email)",
  "phone": "string",
  "avatar": "string (URL)",
  "bio": "string",
  "isActive": "boolean",
  "department": "string (ObjectId)",
  "qualifications": "array (string)",
  "specializations": "array (string)",
  "experience": "string",
  "semester": "string",
  "section": "string",
  "cgpa": "number (0-10)",
  "skills": "array (string)",
  "projects": "array (string)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated User object"
}
```

**Error Responses:**
- 404: User not found

#### DELETE `/users/:id`
Deactivate user (Admin only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "User deactivated successfully"
  }
}
```

**Error Responses:**
- 404: User not found

#### GET `/users`
Get all users (Admin only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (User)"
}
```

#### GET `/users/department/:departmentId`
Get users by department

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (User)"
}
```

---

### 3. Department Management

#### GET `/departments`
Get all departments

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (Department)"
}
```

#### POST `/departments`
Create department (Admin only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "name": "string (min 2, max 100, required)",
  "code": "string (min 2, max 10, uppercase, required)",
  "hodId": "string (ObjectId, required)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": "Department object"
}
```

#### PUT `/departments/:id`
Update department (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "name": "string",
  "code": "string (uppercase)",
  "hodId": "string (ObjectId)",
  "isActive": "boolean"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated Department object"
}
```

**Error Responses:**
- 404: Department not found

#### DELETE `/departments/:id`
Delete department (Admin only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Department deleted successfully"
  }
}
```

**Error Responses:**
- 404: Department not found

#### GET `/departments/:id/statistics`
Get department statistics

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "facultyCount": "number",
    "studentCount": "number",
    "courseCount": "number",
    "avgAttendance": "number",
    "avgGPA": "number"
  }
}
```

---

### 4. Course Management

#### GET `/courses`
Get courses (filtered by user role/department)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `department`: string (ObjectId, optional)
- `semester`: string (optional)
- `type`: string (optional)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "courses": "array (Course)",
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}
```

#### POST `/courses`
Create course (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "name": "string (min 2, max 200, required)",
  "code": "string (min 2, max 20, uppercase, required)",
  "semester": "string (required)",
  "students": "number (min 0)",
  "schedule": "string",
  "room": "string",
  "status": "enum: [active, upcoming, completed]",
  "faculty": "string (ObjectId)",
  "description": "string (max 1000)",
  "credits": "number (min 1, max 10, required)",
  "type": "enum: [core, elective, multidisciplinary, skill-based]",
  "department": "string (ObjectId, required)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": "Course object"
}
```

#### PUT `/courses/:id`
Update course (Admin/HoD/Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "name": "string",
  "code": "string (uppercase)",
  "semester": "string",
  "students": "number",
  "schedule": "string",
  "room": "string",
  "status": "enum: [active, upcoming, completed]",
  "faculty": "string (ObjectId)",
  "description": "string",
  "credits": "number",
  "type": "enum: [core, elective, multidisciplinary, skill-based]",
  "department": "string (ObjectId)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated Course object"
}
```

**Error Responses:**
- 404: Course not found

#### DELETE `/courses/:id`
Delete course (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Course deleted successfully"
  }
}
```

**Error Responses:**
- 404: Course not found

#### GET `/courses/:id/enrollment`
Get course enrollment details

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "courseId": "string",
    "enrolledStudents": "array (User)",
    "totalEnrolled": "number",
    "maxCapacity": "number"
  }
}
```

**Error Responses:**
- 404: Course not found

#### POST `/courses/:id/enroll`
Enroll student in course (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Enrolled successfully"
  }
}
```

**Error Responses:**
- 404: Course not found

#### DELETE `/courses/:id/enroll`
Drop course (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Course dropped successfully"
  }
}
```

**Error Responses:**
- 404: Course not found

---

### 5. Timetable Management

#### GET `/timetable/student/:studentId`
Get student's personal timetable

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Timetable object with slots"
}
```

#### GET `/timetable/faculty/:facultyId`
Get faculty's teaching timetable

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Timetable object with slots"
}
```

#### GET `/timetable/department/:departmentId`
Get department timetable

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `semester`: number (optional)
- `academicYear`: string (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Timetable object with slots"
}
```

#### POST `/timetable`
Create/Update timetable (HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "departmentId": "string (ObjectId, required)",
  "semester": "number (1-12, required)",
  "academicYear": "string (required)",
  "schedule": "array (TimetableSlot)",
  "status": "enum: [draft, approved, published]"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": "Timetable object"
}
```

#### POST `/timetable/ocr-upload`
Upload timetable image for OCR processing (HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body (multipart/form-data):**
- `image`: file (required)
- `departmentId`: string (required)
- `semester`: number (required)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobId": "string",
    "status": "completed",
    "timetable": "Timetable object",
    "message": "OCR processing completed",
    "extractedSlots": "number"
  }
}
```

**Error Responses:**
- 400: No image file uploaded
- 500: OCR processing failed

#### GET `/timetable/ocr-status/:jobId`
Check OCR processing status

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobId": "string",
    "status": "enum: [processing, completed, failed]",
    "progress": "number (optional)",
    "error": "string (optional)"
  }
}
```

#### POST `/timetable/google-calendar-sync`
Sync timetable with Google Calendar

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "timetableId": "string (required)",
  "calendarId": "string (optional, default: 'primary')",
  "syncType": "enum: [individual, bulk] (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Timetable synced with Google Calendar",
    "eventIds": "array (string)",
    "syncedSlots": "number"
  }
}
```

**Error Responses:**
- 404: Timetable not found
- 500: Calendar sync failed

#### GET `/timetable/google-auth-url`
Get Google OAuth URL

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "authUrl": "string"
  }
}
```

**Error Responses:**
- 500: OAuth setup failed

#### GET `/timetable/google-callback`
Handle Google OAuth callback

**Query Parameters:**
- `code`: string (required)

**Response (302 Redirect):**
Redirects to frontend with success/error parameters

---

### 6. Notice Management

#### GET `/notices`
Get notices for current user (filtered by target roles)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `priority`: string (optional)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notices": "array (Notice)",
    "total": "number",
    "unreadCount": "number"
  }
}
```

#### POST `/notices`
Create notice (Admin/HoD/Faculty)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "title": "string (min 3, max 200, required)",
  "content": "string (min 10, max 5000, required)",
  "targetRoles": "array (enum: [admin, hod, faculty, student])",
  "priority": "enum: [low, medium, high]"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": "Notice object"
}
```

#### PUT `/notices/:id`
Update notice (Creator only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "title": "string",
  "content": "string",
  "targetRoles": "array (enum)",
  "priority": "enum: [low, medium, high]"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated Notice object"
}
```

**Error Responses:**
- 404: Notice not found

#### DELETE `/notices/:id`
Delete notice (Creator/Admin only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Notice deleted successfully"
  }
}
```

**Error Responses:**
- 404: Notice not found

#### POST `/notices/:id/read`
Mark notice as read

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Notice marked as read"
  }
}
```

**Error Responses:**
- 404: Notice not found

#### GET `/notices/analytics`
Get notice analytics (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalNotices": "number",
    "readRate": "number",
    "byPriority": "object",
    "recentActivity": "array"
  }
}
```

---

### 7. Attendance Management

#### GET `/attendance/student/:studentId`
Get student attendance

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `courseId`: string (ObjectId, optional)
- `startDate`: date (optional)
- `endDate`: date (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "records": "array (Attendance)",
    "summary": {
      "totalClasses": "number",
      "present": "number",
      "absent": "number",
      "late": "number",
      "percentage": "number"
    }
  }
}
```

#### GET `/attendance/course/:courseId`
Get course attendance (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "records": "array (Attendance)",
    "students": "array (User with attendance stats)"
  }
}
```

#### POST `/attendance/mark`
Mark attendance (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "courseId": "string (ObjectId, required)",
  "date": "date (ISO format, required)",
  "students": [
    {
      "studentId": "string (ObjectId, required)",
      "status": "enum: [present, absent, late] (required)"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Attendance marked successfully",
    "markedCount": "number"
  }
}
```

#### PUT `/attendance/:id`
Update attendance record (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "status": "enum: [present, absent, late]",
  "notes": "string (max 500)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated Attendance object"
}
```

**Error Responses:**
- 404: Attendance record not found

#### GET `/attendance/reports`
Get attendance reports (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reportType": "string",
    "period": "string",
    "data": "array (varies by type)"
  }
}
```

---

### 8. Assignment Management

#### GET `/assignments/student`
Get student assignments (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (Assignment with submission status)"
}
```

#### GET `/assignments/faculty`
Get faculty assignments (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (Assignment with submissions)"
}
```

#### POST `/assignments`
Create assignment (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "title": "string (min 3, max 200, required)",
  "courseId": "string (ObjectId, required)",
  "courseName": "string",
  "description": "string (max 2000)",
  "dueDate": "datetime (ISO format, required)",
  "maxMarks": "number (positive, required)",
  "instructions": "string (max 1000)",
  "attachments": "array (string - URLs)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": "Assignment object"
}
```

#### PUT `/assignments/:id`
Update assignment (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "dueDate": "datetime",
  "maxMarks": "number",
  "status": "enum: [active, closed]",
  "instructions": "string",
  "attachments": "array (string)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated Assignment object"
}
```

**Error Responses:**
- 404: Assignment not found

#### DELETE `/assignments/:id`
Delete assignment (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Assignment deleted successfully"
  }
}
```

**Error Responses:**
- 404: Assignment not found

#### POST `/assignments/:id/submit`
Submit assignment (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "fileUrl": "string (URL, required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "AssignmentSubmission object"
}
```

**Error Responses:**
- 404: Assignment not found

#### PUT `/assignments/submissions/:id/grade`
Grade assignment submission (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "marksObtained": "number (min 0, required)",
  "feedback": "string (max 1000)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated AssignmentSubmission object"
}
```

**Error Responses:**
- 404: Submission not found

#### GET `/assignments/:id/submissions`
Get assignment submissions (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (AssignmentSubmission)"
}
```

**Error Responses:**
- 404: Assignment not found

---

### 9. Fee Management

#### GET `/fees/student/:studentId`
Get student fee records

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "structures": "array (FeeStructure)",
    "payments": "array (FeePayment)",
    "totalDue": "number",
    "totalPaid": "number",
    "balance": "number"
  }
}
```

#### POST `/fees/payment`
Process fee payment (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "feeStructureId": "string (ObjectId, required)",
  "amount": "number (positive, required)",
  "paymentMethod": "enum: [card, netbanking, upi, cash, cheque] (required)",
  "transactionId": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payment": "FeePayment object",
    "receiptUrl": "string"
  }
}
```

#### GET `/fees/reports`
Get fee collection reports (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalCollected": "number",
    "totalDue": "number",
    "collectionRate": "number",
    "byDepartment": "array",
    "bySemester": "array"
  }
}
```

#### POST `/fees/generate-invoice`
Generate fee invoice (Admin only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "studentId": "string (ObjectId, required)",
  "feeStructures": "array (string - IDs, required)",
  "academicYear": "string (required)",
  "semester": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "invoiceId": "string",
    "invoiceUrl": "string (PDF)"
  }
}
```

---

### 10. Grievance Management

#### GET `/grievances/student`
Get student grievances (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (Grievance)"
}
```

#### GET `/grievances/assigned`
Get assigned grievances (Faculty/Admin/HoD)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (Grievance)"
}
```

#### POST `/grievances`
Submit grievance (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "category": "enum: [academic, administrative, technical, hostel, other] (required)",
  "subject": "string (min 5, max 200, required)",
  "description": "string (min 20, max 5000, required)",
  "priority": "enum: [low, medium, high]",
  "attachments": "array (string - URLs)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": "Grievance object"
}
```

#### PUT `/grievances/:id/status`
Update grievance status

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "status": "enum: [submitted, in-progress, resolved, closed] (required)",
  "resolution": "string (max 2000)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated Grievance object"
}
```

**Error Responses:**
- 404: Grievance not found

#### POST `/grievances/:id/assign`
Assign grievance (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "assignedTo": "string (ObjectId, required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated Grievance object"
}
```

**Error Responses:**
- 404: Grievance not found

---

### 11. Extracurricular Activities

#### GET `/activities/student/:studentId`
Get student's extracurricular activities

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `type`: string (optional)
- `academicYear`: string (optional)
- `verified`: boolean (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "activities": "array (ExtracurricularActivity)",
    "totalNEPPoints": "number",
    "byType": "object (count by type)"
  }
}
```

#### POST `/activities`
Log extracurricular activity (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "activityType": "enum: [sports, cultural, technical, social, academic] (required)",
  "title": "string (min 3, max 200, required)",
  "description": "string (max 2000)",
  "organizingBody": "string (max 200)",
  "participationType": "enum: [participant, organizer, winner, volunteer] (required)",
  "startDate": "date (ISO format, required)",
  "endDate": "date (ISO format)",
  "hoursInvolved": "number (positive)",
  "certificateUrl": "string (URL)",
  "skillsGained": "array (string)",
  "nepPoints": "number (min 0)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": "ExtracurricularActivity object"
}
```

#### PUT `/activities/:id`
Update activity (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "activityType": "enum: [sports, cultural, technical, social, academic]",
  "title": "string",
  "description": "string",
  "organizingBody": "string",
  "participationType": "enum: [participant, organizer, winner, volunteer]",
  "startDate": "date",
  "endDate": "date",
  "hoursInvolved": "number",
  "certificateUrl": "string",
  "skillsGained": "array (string)",
  "nepPoints": "number"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated ExtracurricularActivity object"
}
```

**Error Responses:**
- 404: Activity not found

#### DELETE `/activities/:id`
Delete activity (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Activity deleted successfully"
  }
}
```

**Error Responses:**
- 404: Activity not found

#### POST `/activities/:id/verify`
Verify activity (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "status": "enum: [verified, rejected] (required)",
  "comments": "string (max 500)",
  "nepPoints": "number (min 0)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated ExtracurricularActivity object"
}
```

**Error Responses:**
- 404: Activity not found

#### GET `/activities/verification-pending`
Get activities pending verification (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (ExtracurricularActivity)"
}
```

#### GET `/activities/analytics/:studentId`
Get activity analytics for student

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalActivities": "number",
    "totalHours": "number",
    "totalNEPPoints": "number",
    "byType": "object",
    "byParticipationType": "object"
  }
}
```

---

### 12. Workload Allocation (Admin)

#### GET `/workload/faculty/:facultyId`
Get faculty workload allocation

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `academicYear`: string (optional)
- `semester`: number (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": "WorkloadAllocation object"
}
```

#### GET `/workload/department/:departmentId`
Get department workload overview

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "allocations": "array (WorkloadAllocation)",
    "totalHours": "number",
    "avgWorkload": "number"
  }
}
```

#### POST `/workload/allocate`
Create workload allocation (Admin only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "facultyId": "string (ObjectId, required)",
  "facultyName": "string",
  "academicYear": "string (required)",
  "semester": "number (1-12, required)",
  "courses": "array (CourseLoad)",
  "totalHours": "number (min 0)",
  "maxHours": "number (min 0)",
  "additionalDuties": "array (string)",
  "status": "enum: [draft, approved, published]"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": "WorkloadAllocation object"
}
```

#### PUT `/workload/:id`
Update workload allocation (Admin only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "courses": "array (CourseLoad)",
  "totalHours": "number",
  "additionalDuties": "array (string)",
  "status": "enum: [draft, approved, published]"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated WorkloadAllocation object"
}
```

**Error Responses:**
- 404: Workload allocation not found

#### POST `/workload/:id/approve`
Approve workload allocation (HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Workload approved successfully"
  }
}
```

**Error Responses:**
- 404: Workload allocation not found

#### GET `/workload/reports`
Generate workload reports (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `department`: string (optional)
- `academicYear`: string (optional)
- `format`: enum [json, pdf, excel] (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "report": "object or URL (based on format)"
  }
}
```

---

### 13. Mentorship System

#### GET `/mentorship/mentor/:facultyId`
Get mentorship records for faculty

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (MentorshipRecord)"
}
```

#### GET `/mentorship/mentee/:studentId`
Get mentorship records for student

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "MentorshipRecord object"
}
```

#### POST `/mentorship/assign`
Assign mentor to student (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "mentorId": "string (ObjectId, required)",
  "menteeId": "string (ObjectId, required)",
  "goals": "array (string)",
  "meetingSchedule": "string"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": "MentorshipRecord object"
}
```

#### POST `/mentorship/:id/session`
Log mentorship session (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "date": "datetime (ISO format, required)",
  "duration": "number (minutes, positive, required)",
  "type": "enum: [academic, career, personal, general] (required)",
  "topics": "array (string)",
  "outcomes": "string (max 2000)",
  "nextSteps": "string (max 1000)",
  "studentFeedback": {
    "rating": "number (1-5)",
    "comments": "string (max 500)"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "MentorshipRecord object"
}
```

**Error Responses:**
- 404: Mentorship record not found

#### PUT `/mentorship/:id/status`
Update mentorship status

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "status": "enum: [active, completed, transferred] (required)",
  "reason": "string (max 500)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated MentorshipRecord object"
}
```

**Error Responses:**
- 404: Mentorship record not found

#### GET `/mentorship/analytics`
Get mentorship analytics (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalMentorships": "number",
    "activeMentorships": "number",
    "avgSessionsPerMonth": "number",
    "satisfactionRate": "number"
  }
}
```

---

### 14. Approval Workflows (HoD)

#### GET `/approvals/pending`
Get pending approvals for current user

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (ApprovalRequest)"
}
```

#### GET `/approvals/history`
Get approval history

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `type`: string (optional)
- `status`: string (optional)
- `dateRange`: object (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (ApprovalRequest)"
}
```

#### POST `/approvals/request`
Create approval request

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "type": "enum: [course_change, faculty_leave, budget_request, timetable_change, student_grievance] (required)",
  "title": "string (min 3, max 200, required)",
  "description": "string (min 10, max 3000, required)",
  "priority": "enum: [low, medium, high, urgent]",
  "attachments": "array (string - URLs)",
  "deadline": "datetime (ISO format)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": "ApprovalRequest object"
}
```

#### POST `/approvals/:id/action`
Take action on approval request

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "action": "enum: [approved, rejected, requested_changes] (required)",
  "comments": "string (max 1000)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated ApprovalRequest object"
}
```

**Error Responses:**
- 404: Approval request not found

#### PUT `/approvals/:id/escalate`
Escalate approval request

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "escalateTo": "string (ObjectId, required)",
  "reason": "string (min 10, max 1000, required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated ApprovalRequest object"
}
```

**Error Responses:**
- 404: Approval request not found

#### GET `/approvals/analytics`
Get approval analytics (Admin/HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pending": "number",
    "approved": "number",
    "rejected": "number",
    "avgProcessingTime": "number (days)"
  }
}
```

---

### 15. Student Results & Grades

#### GET `/results/student/:studentId`
Get student results

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `academicYear`: string (optional)
- `semester`: number (optional)
- `courseId`: string (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": "array (StudentResult)",
    "overall": {
      "sgpa": "number",
      "cgpa": "number",
      "totalCredits": "number",
      "earnedCredits": "number"
    }
  }
}
```

#### POST `/results/submit`
Submit course results (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "courseId": "string (ObjectId, required)",
  "results": "array (StudentResult)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Results submitted successfully",
    "submittedCount": "number"
  }
}
```

#### PUT `/results/:id`
Update individual result (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "totalMarks": "number (min 0)",
  "obtainedMarks": "number (min 0)",
  "grade": "string (max 5)",
  "gradePoint": "number (min 0, max 10)",
  "status": "enum: [pass, fail, pending]",
  "remarks": "string (max 500)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "Updated StudentResult object"
}
```

**Error Responses:**
- 404: Result not found

#### GET `/results/overall/:studentId`
Get overall academic performance

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "studentId": "string",
    "cgpa": "number",
    "totalCredits": "number",
    "earnedCredits": "number",
    "semesterWise": "array (semester results)"
  }
}
```

#### POST `/results/generate-transcript`
Generate academic transcript

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "studentId": "string (ObjectId, required)",
  "includeProvisional": "boolean (optional)",
  "format": "enum: [pdf, json] (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transcriptUrl": "string (PDF URL)",
    "transcript": "object (if format=json)"
  }
}
```

#### GET `/results/class-performance/:courseId`
Get class performance analytics (Faculty only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "courseId": "string",
    "avgMarks": "number",
    "passRate": "number",
    "gradeDistribution": "object",
    "topPerformers": "array (Student)"
  }
}
```

#### GET `/results/department-analytics`
Get department result analytics (HoD/Admin only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "avgCGPA": "number",
    "passRate": "number",
    "byCourse": "array",
    "bySemester": "array"
  }
}
```

#### GET `/results/nep-assessment/:studentId`
Get NEP 2020 holistic assessment

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `includeSkillAssessment`: boolean (optional)
- `includeCompetencyMapping`: boolean (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "multidisciplinaryCredits": "number",
    "skillBasedCredits": "number",
    "holisticProgress": "object",
    "competencies": "array"
  }
}
```

#### POST `/results/calculate-cgpa`
Calculate CGPA for student

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "studentId": "string (ObjectId, required)",
  "upToSemester": "number (1-12)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cgpa": "number",
    "sgpa": "number (for last semester)",
    "totalCredits": "number"
  }
}
```

---

### 16. Course Registration System

#### GET `/registration/available-courses`
Get available courses for registration (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `semester`: number (optional)
- `type`: string (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "courses": "array (Course)",
    "registrationOpen": "boolean",
    "registrationDeadline": "datetime"
  }
}
```

#### POST `/registration/register`
Register for courses (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Request Body:**
```json
{
  "courseIds": "array (string - ObjectIds, required)",
  "semester": "number (1-12, required)",
  "academicYear": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful",
    "registeredCourses": "array (Course)"
  }
}
```

#### DELETE `/registration/drop/:courseId`
Drop a course (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Course dropped successfully"
  }
}
```

**Error Responses:**
- 404: Course not found

#### GET `/registration/prerequisites/:courseId`
Check course prerequisites

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "prerequisites": "array (Course)",
    "eligible": "boolean",
    "missingRequirements": "array (string)"
  }
}
```

#### POST `/registration/waitlist/:courseId`
Join course waitlist (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Added to waitlist",
    "position": "number"
  }
}
```

#### GET `/registration/status`
Get registration status (Student only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "registered": "array (Course)",
    "pending": "array (Course)",
    "waitlisted": "array (Course)",
    "totalCredits": "number"
  }
}
```

#### POST `/registration/approve/:studentId`
Approve course registration (HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Registration approved"
  }
}
```

#### GET `/registration/department-overview`
Get registration overview (HoD/Admin only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalRegistrations": "number",
    "byCourse": "array",
    "pendingApprovals": "number"
  }
}
```

---

### 17. Analytics & Reports

#### GET `/analytics/dashboard`
Get dashboard analytics

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `role`: string (optional)
- `period`: enum [week, month, semester, year] (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stats": "object (varies by role)",
    "charts": "object",
    "recentActivity": "array"
  }
}
```

#### GET `/analytics/attendance`
Get attendance analytics

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `departmentId`: string (ObjectId, optional)
- `courseId`: string (ObjectId, optional)
- `startDate`: date (optional)
- `endDate`: date (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "overall": "number (percentage)",
    "byCourse": "array",
    "byMonth": "array",
    "trends": "array"
  }
}
```

#### GET `/analytics/academic`
Get academic performance analytics

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `departmentId`: string (ObjectId, optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "avgCGPA": "number",
    "passRate": "number",
    "topPerformers": "array",
    "trends": "array"
  }
}
```

#### GET `/analytics/department`
Get department overview (HoD only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "faculty": "object",
    "students": "object",
    "courses": "object",
    "performance": "object"
  }
}
```

#### GET `/analytics/system`
Get system usage analytics (Admin only)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "activeUsers": "number",
    "loginsByRole": "object",
    "featureUsage": "object",
    "peakHours": "array"
  }
}
```

#### GET `/analytics/enrollment`
Get enrollment trends

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `departmentId`: string (ObjectId, optional)
- `timeframe`: enum [week, month, semester, year] (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "period": "string",
      "enrollments": "number"
    }
  ],
  "timeframe": "string"
}
```

#### GET `/analytics/grades`
Get grade distribution

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `courseId`: string (ObjectId, optional)
- `semester`: number (optional)
- `academicYear`: string (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "grade": "string",
      "count": "number"
    }
  ]
}
```

#### GET `/analytics/fees`
Get fee collection report

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `departmentId`: string (ObjectId, optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalCollected": "number",
    "totalDue": "number",
    "collectionRate": "number",
    "byDepartment": "array",
    "bySemester": "array"
  }
}
```

#### GET `/analytics/notices`
Get notice analytics

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalNotices": "number",
    "readRate": "number",
    "byPriority": "object",
    "recentActivity": "array"
  }
}
```

#### GET `/analytics/approvals`
Get approval analytics

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pending": "number",
    "approved": "number",
    "rejected": "number",
    "avgProcessingTime": "number (days)"
  }
}
```

#### GET `/analytics/nep`
Get NEP 2020 assessment (Student)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `includeSkillAssessment`: boolean (optional)
- `includeCompetencyMapping`: boolean (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "multidisciplinaryCredits": "number",
    "skillBasedCredits": "number",
    "holisticProgress": "object",
    "competencies": "array"
  }
}
```

---

### 18. Charts & Analytics Data

#### GET `/charts/enrollment-trends`
Get enrollment trend data

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `timeframe`: enum [month, year, multi-year] (optional)
- `departmentId`: string (ObjectId, optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "period": "string",
      "count": "number"
    }
  ],
  "timeframe": "string"
}
```

#### GET `/charts/attendance-overview`
Get attendance overview data

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `departmentId`: string (ObjectId, optional)
- `courseId`: string (ObjectId, optional)
- `startDate`: date (optional)
- `endDate`: date (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "overall": {
      "total": "number",
      "present": "number",
      "absent": "number",
      "late": "number",
      "attendanceRate": "number"
    },
    "trends": [
      {
        "month": "string",
        "present": "number",
        "absent": "number",
        "late": "number",
        "total": "number",
        "attendanceRate": "number"
      }
    ]
  }
}
```

#### GET `/charts/grade-distribution`
Get grade distribution data

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `courseId`: string (ObjectId, optional)
- `semester`: number (optional)
- `academicYear`: string (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "distribution": [
      {
        "grade": "string",
        "count": "number",
        "avgMarks": "number",
        "maxMarks": "number",
        "minMarks": "number"
      }
    ],
    "summary": {
      "total": "number",
      "passCount": "number",
      "failCount": "number",
      "passRate": "number"
    }
  }
}
```

#### GET `/charts/department-performance`
Get department performance metrics

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Query Parameters:**
- `academicYear`: string (optional)
- `semester`: number (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "department": {
          "id": "string",
          "name": "string",
          "code": "string"
        },
        "metrics": {
          "studentCount": "number",
          "facultyCount": "number",
          "courseCount": "number",
          "attendanceRate": "number",
          "avgMarks": "number",
          "passRate": "number"
        }
      }
    ],
    "summary": {
      "totalDepartments": "number",
      "avgAttendanceRate": "number",
      "avgMarks": "number",
      "avgPassRate": "number"
    }
  }
}
```

---

### 19. File Management

#### POST `/files/upload`
Upload file (supports assignments, certificates, documents)

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
- `file`: file (required)
- `type`: string (required)
- `relatedEntity`: string (optional)
- `relatedEntityId`: string (ObjectId, optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "fileId": "string",
    "fileUrl": "string",
    "fileName": "string",
    "fileSize": "number",
    "mimeType": "string"
  }
}
```

#### GET `/files/:id`
Download file

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
File download or redirect to file URL

#### DELETE `/files/:id`
Delete file

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "File deleted successfully"
  }
}
```

#### GET `/files/user/:userId`
Get user files

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": "array (File metadata)"
}
```

---

## Error Handling

### Standard Error Response
All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "array (optional)"
  }
}
```

### Common Error Codes

**Authentication Errors:**
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Insufficient permissions
- `AUTH_004`: Account deactivated

**Validation Errors:**
- `VAL_001`: Validation failed
- `VAL_002`: Required field missing
- `VAL_003`: Invalid format
- `VAL_004`: Duplicate entry

**Resource Errors:**
- `RES_001`: Resource not found
- `RES_002`: Resource conflict
- `RES_003`: Resource unavailable

**System Errors:**
- `SYS_001`: Internal server error
- `SYS_002`: Service unavailable
- `SYS_003`: Database error

**Business Logic Errors:**
- `BUS_001`: Operation not allowed
- `BUS_002`: Quota exceeded
- `BUS_003`: Deadline passed

---

## Security & Authentication

### Authentication Flow
1. User logs in with email/password
2. Server validates credentials
3. Server returns JWT token and refresh token
4. Client stores tokens securely
5. Client includes JWT token in Authorization header for all requests
6. When JWT expires, client uses refresh token to get new JWT

### Token Management
- **JWT Token**: 24-hour expiry, used for API authentication
- **Refresh Token**: 30-day expiry, used to obtain new JWT tokens
- **Token Storage**: Secure storage (localStorage with appropriate security measures)

### Role-Based Access Control (RBAC)
Each endpoint is restricted based on user roles:
- **Admin**: Full system access
- **HoD**: Department-level management access
- **Faculty**: Course and student management access
- **Student**: Personal academic access

### Security Best Practices
- All passwords hashed using bcrypt (minimum 10 rounds)
- Input validation and sanitization on all endpoints
- SQL injection prevention
- XSS protection
- CSRF protection for state-changing operations
- Rate limiting: 1000 requests/hour per user
- File upload restrictions (type, size, virus scanning)

---

## NEP 2020 Compliance Features

The API supports NEP 2020 (National Education Policy 2020) requirements:

### Academic Structure
- **Credit-Based Choice System (CBCS)**: Course credits and flexible curriculum
- **Multidisciplinary Courses**: Course type classification and cross-department courses
- **Skill-Based Learning**: Skill-based course tracking and assessment
- **Holistic Progress**: Comprehensive student evaluation including academics and extracurriculars

### Assessment Methods
- **Continuous Evaluation**: Regular assignment and attendance tracking
- **Competency-Based Assessment**: Skill and competency mapping
- **Multiple Assessment Formats**: Theory, practical, project-based evaluations
- **NEP Points System**: Extracurricular activities with NEP point allocation

### Mentorship & Guidance
- **Faculty-Student Mentorship**: Structured mentorship program
- **Session Tracking**: Regular mentorship session logging
- **Goal Setting**: Academic and career goal tracking

### Student Development
- **Extracurricular Tracking**: Comprehensive activity logging with NEP points
- **Holistic Progress Cards**: Combined academic and non-academic assessment
- **Skill Development**: Skill-based course enrollment and tracking

---

## API Usage Examples

### Login Example
```javascript
const response = await fetch('https://api.du-erp.edu.in/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'student@du.ac.in',
    password: 'securepassword',
    rememberMe: true
  })
});

const data = await response.json();
// Store token: localStorage.setItem('authToken', data.data.token);
```

### Authenticated Request Example
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('https://api.du-erp.edu.in/v1/courses', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

### File Upload Example
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('departmentId', 'dept-123');
formData.append('semester', '3');

const response = await fetch('https://api.du-erp.edu.in/v1/timetable/ocr-upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
```

### Attendance Marking Example
```javascript
const response = await fetch('https://api.du-erp.edu.in/v1/attendance/mark', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    courseId: 'course-123',
    date: '2024-02-27',
    students: [
      { studentId: 'student-1', status: 'present' },
      { studentId: 'student-2', status: 'absent' }
    ]
  })
});

const data = await response.json();
```

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:
- **Standard Rate Limit**: 1000 requests per hour per user
- **File Upload Endpoints**: 50 requests per hour
- **Authentication Endpoints**: 10 requests per 15 minutes

Rate limit headers included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1677334800
```

When rate limit is exceeded:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "retryAfter": 3600
    }
  }
}
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "items": "array",
    "total": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number"
  }
}
```

---

## Versioning

The API uses URL-based versioning:
- Current version: `/v1`
- When breaking changes are introduced, a new version will be released (e.g., `/v2`)
- Old versions will be supported for at least 6 months after new version release

---

## Integration Guidelines

### For Frontend Applications
1. **Authentication**: Always include JWT token in Authorization header
2. **Error Handling**: Check for `success: false` and handle errors appropriately
3. **Loading States**: Use loading indicators for API calls
4. **Caching**: Implement appropriate caching strategies for better performance
5. **Validation**: Validate user input before sending to API

### For Third-Party Integrations
1. **Rate Limiting**: Respect rate limits and implement retry logic
2. **Error Handling**: Handle all error codes appropriately
3. **Security**: Never expose API keys or tokens in client-side code
4. **Data Privacy**: Follow data protection regulations
5. **Testing**: Test thoroughly in development environment

### For Mobile Applications
1. **Offline Support**: Implement offline caching where appropriate
2. **Network Handling**: Handle network failures gracefully
3. **Battery Optimization**: Minimize API calls to conserve battery
4. **Background Sync**: Implement background synchronization for critical data

---

## Support & Contact

For API support, integration assistance, or bug reports:
- Email: api-support@du-erp.edu.in
- Documentation: https://docs.du-erp.edu.in
- Status Page: https://status.du-erp.edu.in

---

**Last Updated**: March 21, 2026  
**API Version**: 1.0  
**Document Version**: 1.0

---

## Changelog

### v1.0 (March 21, 2026)
- Initial comprehensive API documentation release
- Complete coverage of all 19 endpoint categories
- Updated schemas based on actual implementation
- Added detailed input/output structures
- Included NEP 2020 compliance features
- Added comprehensive error handling documentation
- Included integration guidelines for different platforms