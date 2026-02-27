// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  HOD: 'hod',
  FACULTY: 'faculty',
  STUDENT: 'student'
};

// Course Types (NEP 2020)
const COURSE_TYPES = {
  CORE: 'core',
  ELECTIVE: 'elective',
  MULTIDISCIPLINARY: 'multidisciplinary',
  SKILL_BASED: 'skill-based'
};

const COURSE_STATUS = {
  ACTIVE: 'active',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed'
};

// Attendance Status
const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
};

// Assignment Status
const ASSIGNMENT_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed'
};

const SUBMISSION_STATUS = {
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  LATE: 'late'
};

// Fee Types
const FEE_TYPES = {
  TUITION: 'tuition',
  LIBRARY: 'library',
  LABORATORY: 'laboratory',
  EXAMINATION: 'examination',
  DEVELOPMENT: 'development',
  SPORTS: 'sports',
  OTHER: 'other'
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIAL: 'partial'
};

const PAYMENT_METHODS = {
  CARD: 'card',
  NETBANKING: 'netbanking',
  UPI: 'upi',
  CASH: 'cash',
  CHEQUE: 'cheque'
};

// Grievance
const GRIEVANCE_CATEGORIES = {
  ACADEMIC: 'academic',
  ADMINISTRATIVE: 'administrative',
  TECHNICAL: 'technical',
  HOSTEL: 'hostel',
  OTHER: 'other'
};

const GRIEVANCE_STATUS = {
  SUBMITTED: 'submitted',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Extracurricular
const ACTIVITY_TYPES = {
  SPORTS: 'sports',
  CULTURAL: 'cultural',
  TECHNICAL: 'technical',
  SOCIAL: 'social',
  ACADEMIC: 'academic'
};

const PARTICIPATION_TYPES = {
  PARTICIPANT: 'participant',
  ORGANIZER: 'organizer',
  WINNER: 'winner',
  VOLUNTEER: 'volunteer'
};

const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

// Timetable
const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];

const TIMETABLE_SLOT_TYPES = {
  LECTURE: 'lecture',
  PRACTICAL: 'practical',
  TUTORIAL: 'tutorial'
};

const TIMETABLE_STATUS = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  PUBLISHED: 'published'
};

// Mentorship
const MENTORSHIP_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  TRANSFERRED: 'transferred'
};

const SESSION_TYPES = {
  ACADEMIC: 'academic',
  CAREER: 'career',
  PERSONAL: 'personal',
  GENERAL: 'general'
};

// Approval
const APPROVAL_TYPES = {
  COURSE_CHANGE: 'course_change',
  FACULTY_LEAVE: 'faculty_leave',
  BUDGET_REQUEST: 'budget_request',
  TIMETABLE_CHANGE: 'timetable_change',
  STUDENT_GRIEVANCE: 'student_grievance'
};

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated'
};

const APPROVAL_ACTIONS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REQUESTED_CHANGES: 'requested_changes'
};

const APPROVER_LEVELS = {
  HOD: 'hod',
  ADMIN: 'admin'
};

// Results
const RESULT_STATUS = {
  PASS: 'pass',
  FAIL: 'fail',
  PENDING: 'pending'
};

// Error Codes
const ERROR_CODES = {
  // Authentication
  AUTH_001: 'Invalid credentials',
  AUTH_002: 'Token expired',
  AUTH_003: 'Insufficient permissions',
  AUTH_004: 'Account deactivated',
  
  // Validation
  VAL_001: 'Validation error',
  VAL_002: 'Required field missing',
  VAL_003: 'Invalid format',
  VAL_004: 'Duplicate entry',
  
  // Resource
  RES_001: 'Resource not found',
  RES_002: 'Resource conflict',
  RES_003: 'Resource unavailable',
  
  // System
  SYS_001: 'Internal server error',
  SYS_002: 'Service unavailable',
  SYS_003: 'Database error',
  
  // Business Logic
  BUS_001: 'Operation not allowed',
  BUS_002: 'Quota exceeded',
  BUS_003: 'Deadline passed'
};

module.exports = {
  USER_ROLES,
  COURSE_TYPES,
  COURSE_STATUS,
  ATTENDANCE_STATUS,
  ASSIGNMENT_STATUS,
  SUBMISSION_STATUS,
  FEE_TYPES,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_STATUS,
  PRIORITY_LEVELS,
  ACTIVITY_TYPES,
  PARTICIPATION_TYPES,
  VERIFICATION_STATUS,
  DAYS_OF_WEEK,
  TIMETABLE_SLOT_TYPES,
  TIMETABLE_STATUS,
  MENTORSHIP_STATUS,
  SESSION_TYPES,
  APPROVAL_TYPES,
  APPROVAL_STATUS,
  APPROVAL_ACTIONS,
  APPROVER_LEVELS,
  RESULT_STATUS,
  ERROR_CODES
};
