const Joi = require('joi');
const { ValidationError } = require('./errorHandler');

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: property === 'body', // Strip unknown keys in body for PATCH
      allowUnknown: property === 'query' // Allow unknown query params
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return next(new ValidationError('Validation failed', details));
    }

    // Replace request data with validated and sanitized values
    req[property] = value;
    next();
  };
};

// Common validation schemas
const commonSchemas = {
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // UUID parameter
  idParam: Joi.object({
    id: Joi.string().uuid().required()
  }),

  // Date range query
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }),

  // Boolean query
  booleanQuery: Joi.object({
    verified: Joi.boolean(),
    isActive: Joi.boolean()
  })
};

// Auth validation schemas
const authSchemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    rememberMe: Joi.boolean().default(false)
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'faculty', 'student', 'hod').required(),
    name: Joi.string().min(2).max(100).required(),
    department: Joi.string(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/)
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  })
};

// User validation schemas
const userSchemas = {
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/),
    avatar: Joi.string().uri(),
    bio: Joi.string().max(500),
    qualifications: Joi.array().items(Joi.string()),
    specializations: Joi.array().items(Joi.string()),
    experience: Joi.string(),
    semester: Joi.string(),
    section: Joi.string(),
    skills: Joi.array().items(Joi.string()),
    projects: Joi.array().items(Joi.string())
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/),
    avatar: Joi.string().uri(),
    bio: Joi.string().max(500),
    isActive: Joi.boolean(),
    department: Joi.string(),
    qualifications: Joi.array().items(Joi.string()),
    specializations: Joi.array().items(Joi.string()),
    experience: Joi.string(),
    semester: Joi.string(),
    section: Joi.string(),
    cgpa: Joi.number().min(0).max(10),
    skills: Joi.array().items(Joi.string()),
    projects: Joi.array().items(Joi.string())
  })
};

// Department validation schemas
const departmentSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(10).uppercase().required(),
    hodId: Joi.string().uuid()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100),
    code: Joi.string().min(2).max(10).uppercase(),
    hodId: Joi.string().uuid(),
    isActive: Joi.boolean()
  })
};

// Course validation schemas
const courseSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    code: Joi.string().min(2).max(20).uppercase().required(),
    semester: Joi.string().required(),
    students: Joi.number().integer().min(0),
    schedule: Joi.string(),
    room: Joi.string(),
    status: Joi.string().valid('active', 'upcoming', 'completed'),
    faculty: Joi.string(),
    description: Joi.string().max(1000),
    credits: Joi.number().integer().min(1).max(10),
    type: Joi.string().valid('core', 'elective', 'multidisciplinary', 'skill-based'),
    department: Joi.string().uuid().required()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(200),
    code: Joi.string().min(2).max(20).uppercase(),
    semester: Joi.string(),
    students: Joi.number().integer().min(0),
    schedule: Joi.string(),
    room: Joi.string(),
    status: Joi.string().valid('active', 'upcoming', 'completed'),
    faculty: Joi.string(),
    description: Joi.string().max(1000),
    credits: Joi.number().integer().min(1).max(10),
    type: Joi.string().valid('core', 'elective', 'multidisciplinary', 'skill-based'),
    department: Joi.string().uuid()
  })
};

// Notice validation schemas
const noticeSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    content: Joi.string().min(10).max(5000).required(),
    targetRoles: Joi.array().items(Joi.string().valid('admin', 'hod', 'faculty', 'student')),
    priority: Joi.string().valid('low', 'medium', 'high')
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(200),
    content: Joi.string().min(10).max(5000),
    targetRoles: Joi.array().items(Joi.string().valid('admin', 'hod', 'faculty', 'student')),
    priority: Joi.string().valid('low', 'medium', 'high')
  })
};

// Attendance validation schemas
const attendanceSchemas = {
  mark: Joi.object({
    courseId: Joi.string().uuid().required(),
    date: Joi.date().iso().required(),
    students: Joi.array().items(
      Joi.object({
        studentId: Joi.string().uuid().required(),
        status: Joi.string().valid('present', 'absent', 'late').required()
      })
    ).min(1).required()
  }),

  update: Joi.object({
    status: Joi.string().valid('present', 'absent', 'late'),
    notes: Joi.string().max(500)
  })
};

// Assignment validation schemas
const assignmentSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    courseId: Joi.string().uuid().required(),
    courseName: Joi.string(),
    description: Joi.string().max(2000),
    dueDate: Joi.date().iso().required(),
    maxMarks: Joi.number().positive().required(),
    instructions: Joi.string().max(1000),
    attachments: Joi.array().items(Joi.string().uri())
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string().max(2000),
    dueDate: Joi.date().iso(),
    maxMarks: Joi.number().positive(),
    status: Joi.string().valid('active', 'closed'),
    instructions: Joi.string().max(1000),
    attachments: Joi.array().items(Joi.string().uri())
  }),

  submit: Joi.object({
    fileUrl: Joi.string().uri().required()
  }),

  grade: Joi.object({
    marksObtained: Joi.number().min(0).required(),
    feedback: Joi.string().max(1000)
  })
};

// Fee validation schemas
const feeSchemas = {
  payment: Joi.object({
    feeStructureId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string().valid('card', 'netbanking', 'upi', 'cash', 'cheque').required(),
    transactionId: Joi.string().required()
  }),

  generateInvoice: Joi.object({
    studentId: Joi.string().uuid().required(),
    feeStructures: Joi.array().items(Joi.string().uuid()).min(1).required(),
    academicYear: Joi.string().required(),
    semester: Joi.string().required()
  })
};

// Grievance validation schemas
const grievanceSchemas = {
  create: Joi.object({
    category: Joi.string().valid('academic', 'administrative', 'technical', 'hostel', 'other').required(),
    subject: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(20).max(5000).required(),
    priority: Joi.string().valid('low', 'medium', 'high'),
    attachments: Joi.array().items(Joi.string().uri())
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('submitted', 'in-progress', 'resolved', 'closed').required(),
    resolution: Joi.string().max(2000)
  }),

  assign: Joi.object({
    assignedTo: Joi.string().uuid().required()
  })
};

// Extracurricular validation schemas
const activitySchemas = {
  create: Joi.object({
    activityType: Joi.string().valid('sports', 'cultural', 'technical', 'social', 'academic').required(),
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(2000),
    organizingBody: Joi.string().max(200),
    participationType: Joi.string().valid('participant', 'organizer', 'winner', 'volunteer').required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    hoursInvolved: Joi.number().positive(),
    certificateUrl: Joi.string().uri(),
    skillsGained: Joi.array().items(Joi.string()),
    nepPoints: Joi.number().min(0)
  }),

  update: Joi.object({
    activityType: Joi.string().valid('sports', 'cultural', 'technical', 'social', 'academic'),
    title: Joi.string().min(3).max(200),
    description: Joi.string().max(2000),
    organizingBody: Joi.string().max(200),
    participationType: Joi.string().valid('participant', 'organizer', 'winner', 'volunteer'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    hoursInvolved: Joi.number().positive(),
    certificateUrl: Joi.string().uri(),
    skillsGained: Joi.array().items(Joi.string()),
    nepPoints: Joi.number().min(0)
  }),

  verify: Joi.object({
    status: Joi.string().valid('verified', 'rejected').required(),
    comments: Joi.string().max(500),
    nepPoints: Joi.number().min(0)
  })
};

// Workload validation schemas
const workloadSchemas = {
  allocate: Joi.object({
    facultyId: Joi.string().uuid().required(),
    facultyName: Joi.string(),
    academicYear: Joi.string().required(),
    semester: Joi.number().integer().min(1).max(12).required(),
    courses: Joi.array().items(
      Joi.object({
        courseId: Joi.string().uuid().required(),
        courseName: Joi.string(),
        hoursPerWeek: Joi.number().positive(),
        studentCount: Joi.number().integer().min(0),
        courseType: Joi.string().valid('theory', 'practical', 'tutorial')
      })
    ),
    totalHours: Joi.number().min(0),
    maxHours: Joi.number().min(0),
    additionalDuties: Joi.array().items(Joi.string()),
    status: Joi.string().valid('draft', 'approved', 'published')
  }),

  update: Joi.object({
    courses: Joi.array().items(
      Joi.object({
        courseId: Joi.string().uuid(),
        courseName: Joi.string(),
        hoursPerWeek: Joi.number().positive(),
        studentCount: Joi.number().integer().min(0),
        courseType: Joi.string().valid('theory', 'practical', 'tutorial')
      })
    ),
    totalHours: Joi.number().min(0),
    additionalDuties: Joi.array().items(Joi.string()),
    status: Joi.string().valid('draft', 'approved', 'published')
  })
};

// Mentorship validation schemas
const mentorshipSchemas = {
  assign: Joi.object({
    mentorId: Joi.string().uuid().required(),
    menteeId: Joi.string().uuid().required(),
    goals: Joi.array().items(Joi.string()),
    meetingSchedule: Joi.string()
  }),

  session: Joi.object({
    date: Joi.date().iso().required(),
    duration: Joi.number().integer().positive().required(),
    type: Joi.string().valid('academic', 'career', 'personal', 'general').required(),
    topics: Joi.array().items(Joi.string()),
    outcomes: Joi.string().max(2000),
    nextSteps: Joi.string().max(1000),
    studentFeedback: Joi.object({
      rating: Joi.number().min(1).max(5),
      comments: Joi.string().max(500)
    })
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('active', 'completed', 'transferred').required(),
    reason: Joi.string().max(500)
  })
};

// Approval validation schemas
const approvalSchemas = {
  create: Joi.object({
    type: Joi.string().valid('course_change', 'faculty_leave', 'budget_request', 'timetable_change', 'student_grievance').required(),
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(3000).required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    attachments: Joi.array().items(Joi.string().uri()),
    deadline: Joi.date().iso()
  }),

  action: Joi.object({
    action: Joi.string().valid('approved', 'rejected', 'requested_changes').required(),
    comments: Joi.string().max(1000)
  }),

  escalate: Joi.object({
    escalateTo: Joi.string().uuid().required(),
    reason: Joi.string().min(10).max(1000).required()
  })
};

// Results validation schemas
const resultsSchemas = {
  submit: Joi.object({
    courseId: Joi.string().uuid().required(),
    results: Joi.array().items(
      Joi.object({
        studentId: Joi.string().uuid().required(),
        totalMarks: Joi.number().min(0).required(),
        obtainedMarks: Joi.number().min(0).required(),
        grade: Joi.string().max(5),
        gradePoint: Joi.number().min(0).max(10),
        status: Joi.string().valid('pass', 'fail', 'pending'),
        remarks: Joi.string().max(500)
      })
    ).min(1).required()
  }),

  update: Joi.object({
    totalMarks: Joi.number().min(0),
    obtainedMarks: Joi.number().min(0),
    grade: Joi.string().max(5),
    gradePoint: Joi.number().min(0).max(10),
    status: Joi.string().valid('pass', 'fail', 'pending'),
    remarks: Joi.string().max(500)
  }),

  calculateCGPA: Joi.object({
    studentId: Joi.string().uuid().required(),
    upToSemester: Joi.number().integer().min(1).max(12)
  })
};

// Registration validation schemas
const registrationSchemas = {
  register: Joi.object({
    courseIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    semester: Joi.number().integer().min(1).max(12).required(),
    academicYear: Joi.string().required()
  })
};

// Timetable validation schemas
const timetableSchemas = {
  create: Joi.object({
    departmentId: Joi.string().uuid().required(),
    semester: Joi.number().integer().min(1).max(12).required(),
    academicYear: Joi.string().required(),
    schedule: Joi.array().items(
      Joi.object({
        courseId: Joi.string().uuid(),
        courseName: Joi.string(),
        courseCode: Joi.string(),
        facultyId: Joi.string().uuid(),
        facultyName: Joi.string(),
        day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
        startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
        endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
        room: Joi.string(),
        type: Joi.string().valid('lecture', 'practical', 'tutorial')
      })
    ),
    status: Joi.string().valid('draft', 'approved', 'published')
  })
};

// File upload schema
const fileSchemas = {
  upload: Joi.object({
    type: Joi.string().valid('assignment', 'certificate', 'document', 'avatar', 'other').required(),
    relatedEntity: Joi.string(),
    relatedEntityId: Joi.string().uuid()
  })
};

module.exports = {
  validate,
  commonSchemas,
  authSchemas,
  userSchemas,
  departmentSchemas,
  courseSchemas,
  noticeSchemas,
  attendanceSchemas,
  assignmentSchemas,
  feeSchemas,
  grievanceSchemas,
  activitySchemas,
  workloadSchemas,
  mentorshipSchemas,
  approvalSchemas,
  resultsSchemas,
  registrationSchemas,
  timetableSchemas,
  fileSchemas
};
