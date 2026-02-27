# Delhi University ERP System - API Documentation

## Overview
This document outlines the complete API structure for the Delhi University College Management ERP system, designed for 4 user roles (Admin, Faculty, Student, HoD) with NEP 2020 compliance.

## Base Configuration
- **Base URL**: `https://api.du-erp.edu.in/v1`
- **Authentication**: JWT Bearer tokens
- **Rate Limiting**: 1000 requests/hour per user
- **Response Format**: JSON
- **Date Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)

## Core Data Models

### User
```json
{
  "id": "string (UUID)",
  "name": "string",
  "email": "string (unique)",
  "password": "string (hashed)",
  "role": "enum: [admin, faculty, student, hod]",
  "avatar": "string (URL, optional)",
  "department": "string",
  "employeeId": "string (for faculty/admin/hod)",
  "studentId": "string (for students)",
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

### Notice
```json
{
  "id": "string (UUID)",
  "title": "string",
  "content": "string",
  "createdBy": "string (User ID)",
  "createdAt": "datetime",
  "targetRoles": "array (UserRole)",
  "priority": "enum: [low, medium, high]",
  "isRead": "boolean"
}
```

### Course
```json
{
  "id": "string (UUID)",
  "name": "string",
  "code": "string (unique)",
  "semester": "string",
  "students": "number",
  "schedule": "string",
  "room": "string",
  "status": "enum: [active, upcoming, completed]",
  "faculty": "string (Faculty name)",
  "description": "string",
  "credits": "number",
  "type": "enum: [core, elective, multidisciplinary, skill-based]",
  "department": "string (Department ID)"
}
```

### Assignment
```json
{
  "id": "string (UUID)",
  "title": "string",
  "courseId": "string",
  "courseName": "string",
  "description": "string",
  "dueDate": "datetime",
  "maxMarks": "number",
  "submittedCount": "number",
  "totalStudents": "number",
  "status": "enum: [active, closed]",
  "facultyId": "string",
  "attachments": "array (string - URLs)",
  "instructions": "string"
}
```

### AssignmentSubmission
```json
{
  "id": "string (UUID)",
  "assignmentId": "string",
  "studentId": "string",
  "studentName": "string",
  "submittedAt": "datetime",
  "fileUrl": "string",
  "marks": "number (optional)",
  "feedback": "string (optional)",
  "status": "enum: [submitted, graded, late]"
}
```

### Attendance
```json
{
  "id": "string (UUID)",
  "studentId": "string",
  "courseId": "string",
  "date": "date",
  "status": "enum: [present, absent, late]",
  "markedBy": "string (Faculty ID)",
  "classType": "string",
  "notes": "string"
}
```

### FeeStructure
```json
{
  "id": "string (UUID)",
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
  "id": "string (UUID)",
  "studentId": "string",
  "feeStructureId": "string",
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
  "id": "string (UUID)",
  "studentId": "string",
  "category": "enum: [academic, administrative, technical, hostel, other]",
  "subject": "string",
  "description": "string",
  "priority": "enum: [low, medium, high]",
  "status": "enum: [submitted, in-progress, resolved, closed]",
  "assignedTo": "string (User ID, optional)",
  "attachments": "array (string)",
  "resolution": "string (optional)",
  "createdAt": "datetime",
  "resolvedAt": "datetime (optional)"
}
```

### ExtracurricularActivity
```json
{
  "id": "string (UUID)",
  "studentId": "string",
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
  "verifiedBy": "string (Faculty ID, optional)"
}
```

### Timetable
```json
{
  "id": "string (UUID)",
  "departmentId": "string",
  "semester": "number",
  "academicYear": "string",
  "schedule": "array (TimetableSlot)",
  "createdBy": "string (User ID)",
  "status": "enum: [draft, approved, published]",
  "ocrProcessed": "boolean",
  "googleCalendarSynced": "boolean"
}
```

### TimetableSlot
```json
{
  "id": "string (UUID)",
  "courseId": "string",
  "courseName": "string",
  "courseCode": "string",
  "facultyId": "string",
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
  "id": "string (UUID)",
  "mentorId": "string (Faculty ID)",
  "mentorName": "string",
  "menteeId": "string (Student ID)",
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
  "id": "string (UUID)",
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
  "id": "string (UUID)",
  "facultyId": "string",
  "facultyName": "string",
  "academicYear": "string",
  "semester": "number",
  "courses": "array (CourseLoad)",
  "totalHours": "number",
  "maxHours": "number",
  "additionalDuties": "array (string)",
  "status": "enum: [draft, approved, published]",
  "approvedBy": "string (HoD ID, optional)",
  "createdBy": "string (Admin ID)"
}
```

### CourseLoad
```json
{
  "courseId": "string",
  "courseName": "string",
  "hoursPerWeek": "number",
  "studentCount": "number",
  "courseType": "enum: [theory, practical, tutorial]"
}
```

### ApprovalRequest
```json
{
  "id": "string (UUID)",
  "type": "enum: [course_change, faculty_leave, budget_request, timetable_change, student_grievance]",
  "requesterId": "string (User ID)",
  "requesterName": "string",
  "title": "string",
  "description": "string",
  "priority": "enum: [low, medium, high, urgent]",
  "status": "enum: [pending, approved, rejected, escalated]",
  "approverLevel": "enum: [hod, admin]",
  "currentApprover": "string (User ID)",
  "approvalHistory": "array (ApprovalAction)",
  "attachments": "array (string - URLs)",
  "deadline": "datetime",
  "createdAt": "datetime"
}
```

### ApprovalAction
```json
{
  "userId": "string",
  "userName": "string",
  "action": "enum: [approved, rejected, requested_changes]",
  "timestamp": "datetime",
  "comments": "string"
}
```

### StudentResult
```json
{
  "id": "string (UUID)",
  "studentId": "string",
  "courseId": "string",
  "courseName": "string",
  "courseCode": "string",
  "academicYear": "string",
  "semester": "number",
  "totalMarks": "number",
  "obtainedMarks": "number",
  "grade": "string",
  "gradePoint": "number",
  "status": "enum: [pass, fail, pending]",
  "evaluatedBy": "string (Faculty ID)",
  "evaluatedDate": "datetime",
  "remarks": "string"
}
```

### Department
```json
{
  "id": "string (UUID)",
  "name": "string",
  "code": "string (unique)",
  "hodId": "string (User ID)",
  "hodName": "string",
  "facultyCount": "number",
  "studentCount": "number",
  "isActive": "boolean"
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
  "email": "string",
  "password": "string",
  "rememberMe": "boolean"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": "User object",
    "token": "JWT string",
    "refreshToken": "string",
    "expiresIn": "number (seconds)"
  }
}
```

#### POST `/auth/register`
Register new user (Admin only)

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "role": "enum: [admin, faculty, student, hod]",
  "name": "string",
  "department": "string",
  "phone": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": "User object",
    "message": "User registered successfully"
  }
}
```

#### POST `/auth/forgot-password`
Request password reset

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
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
  "token": "string",
  "newPassword": "string"
}
```

**Response:**
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
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "JWT string",
    "expiresIn": "number"
  }
}
```

#### POST `/auth/logout`
Logout user (invalidate tokens)

**Response:**
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

**Response:**
```json
{
  "success": true,
  "data": "User object"
}
```

#### PUT `/users/profile`
Update current user profile

**Request Body:** `Partial User object`

**Response:**
```json
{
  "success": true,
  "data": "Updated User object"
}
```

#### GET `/users/public-profile/:userId`
Get public profile for sharing (Used in ShareableProfile component)

**Response:**
```json
{
  "success": true,
  "data": "User object (public fields only)"
}
```

#### POST `/users/generate-qr`
Generate QR code for profile sharing

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCodeUrl": "string (base64 or URL)"
  }
}
```

#### GET `/users/:id`
Get user by ID (Admin/HoD only)

**Response:**
```json
{
  "success": true,
  "data": "User object"
}
```

#### PUT `/users/:id`
Update user (Admin/HoD only)

**Request Body:** `Partial User object`

**Response:**
```json
{
  "success": true,
  "data": "Updated User object"
}
```

#### DELETE `/users/:id`
Deactivate user (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User deactivated successfully"
  }
}
```

#### GET `/users/department/:departmentId`
Get users by department

**Response:**
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

**Response:**
```json
{
  "success": true,
  "data": "array (Department)"
}
```

#### POST `/departments`
Create department (Admin only)

**Request Body:** `Department object`

**Response:**
```json
{
  "success": true,
  "data": "Department object"
}
```

#### PUT `/departments/:id`
Update department (Admin/HoD only)

**Request Body:** `Partial Department object`

**Response:**
```json
{
  "success": true,
  "data": "Updated Department object"
}
```

#### DELETE `/departments/:id`
Delete department (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Department deleted successfully"
  }
}
```

#### GET `/departments/:id/statistics`
Get department statistics

**Response:**
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

**Query Params:**
- `department`: string (optional)
- `semester`: string (optional)
- `type`: string (optional)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response:**
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

**Request Body:** `Course object`

**Response:**
```json
{
  "success": true,
  "data": "Course object"
}
```

#### PUT `/courses/:id`
Update course (Admin/HoD/Faculty only)

**Request Body:** `Partial Course object`

**Response:**
```json
{
  "success": true,
  "data": "Updated Course object"
}
```

#### DELETE `/courses/:id`
Delete course (Admin/HoD only)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Course deleted successfully"
  }
}
```

#### GET `/courses/:id/enrollment`
Get course enrollment details

**Response:**
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

#### POST `/courses/:id/enroll`
Enroll student in course (Student only - used in CourseRegistration)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Enrolled successfully"
  }
}
```

#### DELETE `/courses/:id/enroll`
Drop course (Student only)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Course dropped successfully"
  }
}
```

---

### 5. Timetable Management

#### GET `/timetable/student/:studentId`
Get student's personal timetable

**Response:**
```json
{
  "success": true,
  "data": "Timetable object with slots"
}
```

#### GET `/timetable/faculty/:facultyId`
Get faculty's teaching timetable

**Response:**
```json
{
  "success": true,
  "data": "Timetable object with slots"
}
```

#### GET `/timetable/department/:departmentId`
Get department timetable

**Query Params:**
- `semester`: number (optional)
- `academicYear`: string (optional)

**Response:**
```json
{
  "success": true,
  "data": "Timetable object with slots"
}
```

#### POST `/timetable`
Create/Update timetable (HoD only)

**Request Body:** `Timetable object`

**Response:**
```json
{
  "success": true,
  "data": "Timetable object"
}
```

#### POST `/timetable/ocr-upload`
Upload timetable image for OCR processing (HoD only - used in TimetableOCR component)

**Request Body:** `multipart/form-data`
- `image`: file
- `departmentId`: string
- `semester`: number

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "string",
    "status": "processing",
    "message": "OCR processing started"
  }
}
```

#### GET `/timetable/ocr-status/:jobId`
Check OCR processing status

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "string",
    "status": "enum: [processing, completed, failed]",
    "timetable": "Timetable object (if completed)",
    "error": "string (if failed)"
  }
}
```

#### POST `/timetable/google-calendar-sync`
Sync timetable with Google Calendar (used in FullTimetable component)

**Request Body:**
```json
{
  "timetableId": "string",
  "calendarId": "string (optional)",
  "syncType": "enum: [individual, bulk]"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Timetable synced with Google Calendar",
    "eventIds": "array (string)"
  }
}
```

---

### 6. Notice Management

#### GET `/notices`
Get notices for current user (filtered by target roles)

**Query Params:**
- `type`: string (optional)
- `priority`: string (optional)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response:**
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

**Request Body:** `Notice object`

**Response:**
```json
{
  "success": true,
  "data": "Notice object"
}
```

#### PUT `/notices/:id`
Update notice (Creator only)

**Request Body:** `Partial Notice object`

**Response:**
```json
{
  "success": true,
  "data": "Updated Notice object"
}
```

#### DELETE `/notices/:id`
Delete notice (Creator/Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Notice deleted successfully"
  }
}
```

#### POST `/notices/:id/read`
Mark notice as read

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Notice marked as read"
  }
}
```

#### GET `/notices/analytics`
Get notice analytics (Admin/HoD only)

**Response:**
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
Get student attendance (used in StudentAttendanceSection)

**Query Params:**
- `courseId`: string (optional)
- `startDate`: date (optional)
- `endDate`: date (optional)

**Response:**
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
Get course attendance (Faculty only - used in AttendanceSection)

**Response:**
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

**Request Body:**
```json
{
  "courseId": "string",
  "date": "date",
  "students": [
    {
      "studentId": "string",
      "status": "enum: [present, absent, late]"
    }
  ]
}
```

**Response:**
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

**Request Body:**
```json
{
  "status": "enum: [present, absent, late]",
  "notes": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": "Updated Attendance object"
}
```

#### GET `/attendance/reports`
Get attendance reports (Admin/HoD only)

**Query Params:**
- `type`: enum [individual, class, department]
- `period`: enum [weekly, monthly, semester]

**Response:**
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
Get student assignments (Student only - used in StudentAssignmentsSection)

**Response:**
```json
{
  "success": true,
  "data": "array (Assignment with submission status)"
}
```

#### GET `/assignments/faculty`
Get faculty assignments (Faculty only - used in AssignmentsSection)

**Response:**
```json
{
  "success": true,
  "data": "array (Assignment with submissions)"
}
```

#### POST `/assignments`
Create assignment (Faculty only)

**Request Body:** `Assignment object`

**Response:**
```json
{
  "success": true,
  "data": "Assignment object"
}
```

#### PUT `/assignments/:id`
Update assignment (Faculty only)

**Request Body:** `Partial Assignment object`

**Response:**
```json
{
  "success": true,
  "data": "Updated Assignment object"
}
```

#### DELETE `/assignments/:id`
Delete assignment (Faculty only)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Assignment deleted successfully"
  }
}
```

#### POST `/assignments/:id/submit`
Submit assignment (Student only)

**Request Body:** `AssignmentSubmission object`

**Response:**
```json
{
  "success": true,
  "data": "AssignmentSubmission object"
}
```

#### PUT `/assignments/submissions/:id/grade`
Grade assignment submission (Faculty only)

**Request Body:**
```json
{
  "marksObtained": "number",
  "feedback": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": "Updated AssignmentSubmission object"
}
```

#### GET `/assignments/:id/submissions`
Get assignment submissions (Faculty only)

**Response:**
```json
{
  "success": true,
  "data": "array (AssignmentSubmission)"
}
```

---

### 9. Fee Management

#### GET `/fees/student/:studentId`
Get student fee records (used in StudentFeePayment)

**Response:**
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

**Request Body:**
```json
{
  "feeStructureId": "string",
  "amount": "number",
  "paymentMethod": "enum: [card, netbanking, upi, cash, cheque]",
  "transactionId": "string"
}
```

**Response:**
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
Get fee collection reports (Admin/HoD only - used in ReportsSection)

**Response:**
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

**Request Body:**
```json
{
  "studentId": "string",
  "feeStructures": "array (string - IDs)",
  "academicYear": "string",
  "semester": "string"
}
```

**Response:**
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
Get student grievances (Student only - used in GrievanceSection)

**Response:**
```json
{
  "success": true,
  "data": "array (Grievance)"
}
```

#### GET `/grievances/assigned`
Get assigned grievances (Faculty/Admin/HoD)

**Response:**
```json
{
  "success": true,
  "data": "array (Grievance)"
}
```

#### POST `/grievances`
Submit grievance (Student only)

**Request Body:** `Grievance object`

**Response:**
```json
{
  "success": true,
  "data": "Grievance object"
}
```

#### PUT `/grievances/:id/status`
Update grievance status

**Request Body:**
```json
{
  "status": "enum: [submitted, in-progress, resolved, closed]",
  "resolution": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": "Updated Grievance object"
}
```

#### POST `/grievances/:id/assign`
Assign grievance (Admin/HoD only)

**Request Body:**
```json
{
  "assignedTo": "string (User ID)"
}
```

**Response:**
```json
{
  "success": true,
  "data": "Updated Grievance object"
}
```

---

### 11. Extracurricular Activities

#### GET `/activities/student/:studentId`
Get student's extracurricular activities (used in ExtracurricularLogs)

**Query Params:**
- `type`: string (optional)
- `academicYear`: string (optional)
- `verified`: boolean (optional)

**Response:**
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

**Request Body:** `ExtracurricularActivity object`

**Response:**
```json
{
  "success": true,
  "data": "ExtracurricularActivity object"
}
```

#### PUT `/activities/:id`
Update activity (Student only)

**Request Body:** `Partial ExtracurricularActivity object`

**Response:**
```json
{
  "success": true,
  "data": "Updated ExtracurricularActivity object"
}
```

#### DELETE `/activities/:id`
Delete activity (Student only)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Activity deleted successfully"
  }
}
```

#### POST `/activities/:id/verify`
Verify activity (Faculty only)

**Request Body:**
```json
{
  "status": "enum: [verified, rejected]",
  "comments": "string",
  "nepPoints": "number"
}
```

**Response:**
```json
{
  "success": true,
  "data": "Updated ExtracurricularActivity object"
}
```

#### GET `/activities/verification-pending`
Get activities pending verification (Faculty only)

**Response:**
```json
{
  "success": true,
  "data": "array (ExtracurricularActivity)"
}
```

#### GET `/activities/analytics/:studentId`
Get activity analytics for student

**Response:**
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
Get faculty workload allocation (used in WorkloadAllocation)

**Query Params:**
- `academicYear`: string (optional)
- `semester`: number (optional)

**Response:**
```json
{
  "success": true,
  "data": "WorkloadAllocation object"
}
```

#### GET `/workload/department/:departmentId`
Get department workload overview

**Response:**
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

**Request Body:** `WorkloadAllocation object`

**Response:**
```json
{
  "success": true,
  "data": "WorkloadAllocation object"
}
```

#### PUT `/workload/:id`
Update workload allocation (Admin only)

**Request Body:** `Partial WorkloadAllocation object`

**Response:**
```json
{
  "success": true,
  "data": "Updated WorkloadAllocation object"
}
```

#### POST `/workload/:id/approve`
Approve workload allocation (HoD only)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Workload approved successfully"
  }
}
```

#### GET `/workload/reports`
Generate workload reports (Admin/HoD only)

**Query Params:**
- `department`: string (optional)
- `academicYear`: string (optional)
- `format`: enum [json, pdf, excel] (optional)

**Response:**
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
Get mentorship records for faculty (used in MentorshipTracking)

**Response:**
```json
{
  "success": true,
  "data": "array (MentorshipRecord)"
}
```

#### GET `/mentorship/mentee/:studentId`
Get mentorship records for student

**Response:**
```json
{
  "success": true,
  "data": "MentorshipRecord object"
}
```

#### POST `/mentorship/assign`
Assign mentor to student (Admin/HoD only)

**Request Body:**
```json
{
  "mentorId": "string",
  "menteeId": "string",
  "goals": "array (string)"
}
```

**Response:**
```json
{
  "success": true,
  "data": "MentorshipRecord object"
}
```

#### POST `/mentorship/:id/session`
Log mentorship session (Faculty only)

**Request Body:** `MentorshipSession object`

**Response:**
```json
{
  "success": true,
  "data": "MentorshipSession object"
}
```

#### PUT `/mentorship/:id/status`
Update mentorship status

**Request Body:**
```json
{
  "status": "enum: [active, completed, transferred]",
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": "Updated MentorshipRecord object"
}
```

#### GET `/mentorship/analytics`
Get mentorship analytics (Admin/HoD only)

**Response:**
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
Get pending approvals for current user (used in HoDApprovalsSection)

**Response:**
```json
{
  "success": true,
  "data": "array (ApprovalRequest)"
}
```

#### GET `/approvals/history`
Get approval history

**Query Params:**
- `type`: string (optional)
- `status`: string (optional)
- `dateRange`: object (optional)

**Response:**
```json
{
  "success": true,
  "data": "array (ApprovalRequest)"
}
```

#### POST `/approvals/request`
Create approval request

**Request Body:** `ApprovalRequest object`

**Response:**
```json
{
  "success": true,
  "data": "ApprovalRequest object"
}
```

#### POST `/approvals/:id/action`
Take action on approval request

**Request Body:** `ApprovalAction object`

**Response:**
```json
{
  "success": true,
  "data": "Updated ApprovalRequest object"
}
```

#### PUT `/approvals/:id/escalate`
Escalate approval request

**Request Body:**
```json
{
  "escalateTo": "string (User ID)",
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": "Updated ApprovalRequest object"
}
```

#### GET `/approvals/analytics`
Get approval analytics (Admin/HoD only)

**Response:**
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
Get student results (used in StudentResults)

**Query Params:**
- `academicYear`: string (optional)
- `semester`: number (optional)
- `courseId`: string (optional)

**Response:**
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

**Request Body:**
```json
{
  "courseId": "string",
  "results": "array (StudentResult)"
}
```

**Response:**
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

**Request Body:** `Partial StudentResult object`

**Response:**
```json
{
  "success": true,
  "data": "Updated StudentResult object"
}
```

#### GET `/results/overall/:studentId`
Get overall academic performance

**Response:**
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

**Request Body:**
```json
{
  "studentId": "string",
  "includeProvisional": "boolean",
  "format": "enum: [pdf, json]"
}
```

**Response:**
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

**Response:**
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

**Response:**
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

**Query Params:**
- `includeSkillAssessment`: boolean (optional)
- `includeCompetencyMapping`: boolean (optional)

**Response:**
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

**Request Body:**
```json
{
  "studentId": "string",
  "upToSemester": "number"
}
```

**Response:**
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
Get available courses for registration (Student only - used in CourseRegistration)

**Query Params:**
- `semester`: number (optional)
- `type`: string (optional)

**Response:**
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

**Request Body:**
```json
{
  "courseIds": "array (string)",
  "semester": "number",
  "academicYear": "string"
}
```

**Response:**
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

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Course dropped successfully"
  }
}
```

#### GET `/registration/prerequisites/:courseId`
Check course prerequisites

**Response:**
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

**Response:**
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

**Response:**
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

**Response:**
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

**Response:**
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
Get dashboard analytics (used in all dashboard home screens)

**Query Params:**
- `role`: string
- `period`: enum [week, month, semester, year] (optional)

**Response:**
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

**Response:**
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

#### GET `/analytics/academic-performance`
Get academic performance analytics

**Response:**
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

#### GET `/analytics/department-overview`
Get department overview (HoD only - used in HoDReportsSection)

**Response:**
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

#### GET `/analytics/system-usage`
Get system usage analytics (Admin only)

**Response:**
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

#### POST `/reports/generate`
Generate custom reports (Admin/HoD only - used in ReportsSection)

**Request Body:**
```json
{
  "type": "enum: [attendance, academic, fee, student, faculty]",
  "filters": "object",
  "format": "enum: [pdf, excel, csv]",
  "dateRange": "object (start/end)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "string",
    "reportUrl": "string",
    "expiresAt": "datetime"
  }
}
```

---

### 18. File Management

#### POST `/files/upload`
Upload file (supports assignments, certificates, documents)

**Request Body:** `multipart/form-data`
- `file`: file
- `type`: string
- `relatedEntity`: string (optional)
- `relatedEntityId`: string (optional)

**Response:**
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

**Response:** File download or redirect to file URL

#### DELETE `/files/:id`
Delete file

**Response:**
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

**Response:**
```json
{
  "success": true,
  "data": "array (File metadata)"
}
```

---

### 19. Charts & Analytics Data (for Admin Dashboard)

#### GET `/charts/enrollment-trends`
Get enrollment trend data (used in EnrollmentChart)

**Query Params:**
- `department`: string (optional)
- `timeframe`: enum [semester, year, multi-year] (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "string",
      "enrollments": "number"
    }
  ]
}
```

#### GET `/charts/attendance-overview`
Get attendance overview data (used in AttendanceChart)

**Query Params:**
- `courseId`: string (optional)
- `departmentId`: string (optional)
- `timeframe`: string (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "string",
      "percentage": "number"
    }
  ]
}
```

#### GET `/charts/grade-distribution`
Get grade distribution data (used in GradeChart)

**Query Params:**
- `courseId`: string (optional)
- `semester`: number (optional)
- `academicYear`: string (optional)

**Response:**
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

#### GET `/charts/department-performance`
Get department performance metrics (used in DepartmentChart)

**Query Params:**
- `departmentId`: string (optional)
- `metrics`: array [attendance, grades, enrollment] (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "department": "string",
      "metrics": "object"
    }
  ]
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
    "details": "object (optional)"
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
- `VAL_001`: Validation error
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

## Support & Contact

For API support, integration assistance, or bug reports:
- Email: api-support@du-erp.edu.in
- Documentation: https://docs.du-erp.edu.in
- Status Page: https://status.du-erp.edu.in

---

**Last Updated**: February 27, 2026  
**API Version**: 1.0  
**Document Version**: 2.0
