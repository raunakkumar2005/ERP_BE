const mongoose = require('mongoose');
require('dotenv').config();

const {
  User,
  Department,
  Course,
  Notice,
  Attendance,
  Assignment,
  AssignmentSubmission,
  FeeStructure,
  FeePayment,
  Grievance,
  ExtracurricularActivity,
  Timetable,
  MentorshipRecord,
  WorkloadAllocation,
  ApprovalRequest,
  StudentResult,
  File
} = require('./models');

const {
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
  RESULT_STATUS
} = require('./config/constants');

const DEFAULT_PASSWORD = 'Demo@1234';
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';
const ACADEMIC_YEAR = '2025-2026';
const DEFAULT_SEMESTER = 4;

const args = new Set(process.argv.slice(2));
const OPTIONS = {
  clearAll: args.has('--clear') || args.has('--clear-all')
};

const DEPARTMENTS = [
  { name: 'Computer Science and Engineering', code: 'CSE' },
  { name: 'Electronics and Communication Engineering', code: 'ECE' },
  { name: 'Mechanical Engineering', code: 'MEC' },
  { name: 'Civil Engineering', code: 'CIV' },
  { name: 'Electrical and Electronics Engineering', code: 'EEE' }
];

const STUDENT_FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun',
  'Sai', 'Krishna', 'Ishaan', 'Reyansh', 'Kabir',
  'Aanya', 'Ananya', 'Diya', 'Myra', 'Saanvi',
  'Riya', 'Prisha', 'Kavya', 'Anika', 'Ira'
];

const STUDENT_LAST_NAMES = [
  'Sharma', 'Verma', 'Nair', 'Reddy', 'Patel',
  'Gupta', 'Rao', 'Mishra', 'Das', 'Mehta'
];

const FACULTY_NAMES = [
  'Dr. Amit Sharma',
  'Dr. Priya Nair',
  'Dr. Rajesh Verma',
  'Dr. Sunita Iyer',
  'Dr. Vikram Rao',
  'Dr. Neha Gupta',
  'Dr. Rakesh Menon',
  'Dr. Pooja Reddy',
  'Dr. Suresh Kulkarni',
  'Dr. Anita Desai'
];

const HOD_NAMES = [
  'Prof. Meera Krishnan',
  'Prof. Anil Kumar',
  'Prof. Shalini Gupta',
  'Prof. Arvind Menon',
  'Prof. Deepa Raghavan'
];

const COURSE_BLUEPRINTS = [
  {
    type: COURSE_TYPES.CORE,
    entries: [
      { title: 'Foundations', credits: 4, maxCapacity: 70 },
      { title: 'Advanced Concepts', credits: 4, maxCapacity: 65 }
    ]
  },
  {
    type: COURSE_TYPES.ELECTIVE,
    entries: [
      { title: 'Applications', credits: 3, maxCapacity: 50 },
      { title: 'Seminar', credits: 2, maxCapacity: 40 }
    ]
  },
  {
    type: COURSE_TYPES.MULTIDISCIPLINARY,
    entries: [
      { title: 'Interdisciplinary Lab', credits: 3, maxCapacity: 55 },
      { title: 'Systems Thinking', credits: 3, maxCapacity: 60 }
    ]
  },
  {
    type: COURSE_TYPES.SKILL_BASED,
    entries: [
      { title: 'Industry Skills', credits: 2, maxCapacity: 45 },
      { title: 'Project Studio', credits: 2, maxCapacity: 45 }
    ]
  }
];

const DEPARTMENT_SUBJECTS = {
  CSE: ['Data Structures', 'Software Engineering', 'Machine Learning', 'Cloud Computing'],
  ECE: ['Signals and Systems', 'Digital Design', 'Embedded Systems', 'Communication Networks'],
  MEC: ['Thermodynamics', 'Machine Design', 'Manufacturing Systems', 'Fluid Mechanics'],
  CIV: ['Structural Engineering', 'Geotechnical Engineering', 'Transportation Systems', 'Environmental Engineering'],
  EEE: ['Circuit Analysis', 'Power Systems', 'Control Engineering', 'Electrical Machines']
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample(array) {
  return array[randomInt(0, array.length - 1)];
}

function slugifyName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, '.');
}

function normalizeRoleLabel(role) {
  return role.replace('-', '_').toUpperCase();
}

function gradeFromPercentage(percentage) {
  if (percentage >= 90) return { grade: 'O', gradePoint: 10, status: RESULT_STATUS.PASS };
  if (percentage >= 80) return { grade: 'A+', gradePoint: 9, status: RESULT_STATUS.PASS };
  if (percentage >= 70) return { grade: 'A', gradePoint: 8, status: RESULT_STATUS.PASS };
  if (percentage >= 60) return { grade: 'B+', gradePoint: 7, status: RESULT_STATUS.PASS };
  if (percentage >= 50) return { grade: 'B', gradePoint: 6, status: RESULT_STATUS.PASS };
  if (percentage >= 40) return { grade: 'C', gradePoint: 5, status: RESULT_STATUS.PASS };
  return { grade: 'F', gradePoint: 0, status: RESULT_STATUS.FAIL };
}

function requiredEnumValue(enumObj, key) {
  const value = enumObj[key];
  if (!value) {
    throw new Error(`Missing enum key ${key}`);
  }
  return value;
}

async function connectDatabase() {
  await mongoose.connect(DB_URI);
  console.log('Connected to database');
}

async function clearAllData() {
  console.log('Clear mode enabled: deleting existing records from ERP collections');

  await Attendance.deleteMany({});
  await AssignmentSubmission.deleteMany({});
  await Assignment.deleteMany({});
  await StudentResult.deleteMany({});
  await ApprovalRequest.deleteMany({});
  await MentorshipRecord.deleteMany({});
  await WorkloadAllocation.deleteMany({});
  await Timetable.deleteMany({});
  await ExtracurricularActivity.deleteMany({});
  await Grievance.deleteMany({});
  await File.deleteMany({});
  await FeePayment.deleteMany({});
  await FeeStructure.deleteMany({});
  await Notice.deleteMany({});
  await Course.deleteMany({});
  await User.deleteMany({});
  await Department.deleteMany({});

  console.log('All records cleared');
}

async function seedDepartments() {
  console.log('Seeding departments');

  const docs = [];

  for (const dept of DEPARTMENTS) {
    const doc = await Department.findOneAndUpdate(
      { code: dept.code },
      {
        $set: {
          name: dept.name,
          code: dept.code,
          isActive: true
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    docs.push(doc);
  }

  return docs;
}

async function upsertUserByEmail(payload) {
  const existing = await User.findOne({ email: payload.email }).select('+password');

  if (!existing) {
    return User.create(payload);
  }

  existing.name = payload.name;
  existing.role = payload.role;
  existing.phone = payload.phone;
  existing.department = payload.department || null;
  existing.employeeId = payload.employeeId || null;
  existing.studentId = payload.studentId || null;
  existing.qualifications = payload.qualifications || [];
  existing.specializations = payload.specializations || [];
  existing.experience = payload.experience || null;
  existing.semester = payload.semester || null;
  existing.section = payload.section || null;
  existing.cgpa = payload.cgpa != null ? payload.cgpa : null;
  existing.skills = payload.skills || [];
  existing.projects = payload.projects || [];
  existing.isActive = true;

  if (!existing.password || OPTIONS.clearAll) {
    existing.password = payload.password;
  }

  await existing.save();
  return existing;
}

async function seedAdmin() {
  console.log('Seeding admin user');

  return upsertUserByEmail({
    name: 'System Administrator',
    email: 'admin@erp.demo.edu',
    password: DEFAULT_PASSWORD,
    role: USER_ROLES.ADMIN,
    phone: '+91-90000-10000',
    employeeId: 'ADM-001'
  });
}

async function seedHods(departments) {
  console.log('Seeding HOD users');

  const hodsByDepartment = new Map();

  for (let i = 0; i < departments.length; i += 1) {
    const dept = departments[i];
    const displayName = HOD_NAMES[i];
    const emailPrefix = slugifyName(displayName).replace(/^prof\./, 'hod.');
    const hod = await upsertUserByEmail({
      name: displayName,
      email: `${emailPrefix}.${dept.code.toLowerCase()}@erp.demo.edu`,
      password: DEFAULT_PASSWORD,
      role: USER_ROLES.HOD,
      phone: `+91-90010-${String(1000 + i)}`,
      department: dept._id,
      employeeId: `HOD-${dept.code}`,
      qualifications: ['Ph.D.', 'M.Tech'],
      specializations: [sample(DEPARTMENT_SUBJECTS[dept.code])],
      experience: `${12 + i} years`
    });

    await Department.findByIdAndUpdate(dept._id, {
      $set: {
        hodId: hod._id,
        hodName: hod.name
      }
    });

    hodsByDepartment.set(dept.code, hod);
  }

  return hodsByDepartment;
}

async function seedFaculty(departments) {
  console.log('Seeding faculty users (10 total)');

  const facultyUsers = [];

  for (let i = 0; i < FACULTY_NAMES.length; i += 1) {
    const dept = departments[i % departments.length];
    const name = FACULTY_NAMES[i];
    const username = slugifyName(name).replace(/^dr\./, 'faculty.');

    const faculty = await upsertUserByEmail({
      name,
      email: `${username}.${dept.code.toLowerCase()}@erp.demo.edu`,
      password: DEFAULT_PASSWORD,
      role: USER_ROLES.FACULTY,
      phone: `+91-90020-${String(1000 + i)}`,
      department: dept._id,
      employeeId: `FAC-${String(i + 1).padStart(3, '0')}`,
      qualifications: ['Ph.D.', 'M.Tech'],
      specializations: [
        sample(DEPARTMENT_SUBJECTS[dept.code]),
        sample(DEPARTMENT_SUBJECTS[dept.code])
      ],
      experience: `${randomInt(4, 18)} years`
    });

    facultyUsers.push(faculty);
  }

  return facultyUsers;
}

function buildStudentName(index) {
  const first = STUDENT_FIRST_NAMES[index % STUDENT_FIRST_NAMES.length];
  const last = STUDENT_LAST_NAMES[Math.floor(index / STUDENT_FIRST_NAMES.length) % STUDENT_LAST_NAMES.length];
  return `${first} ${last}`;
}

async function seedStudents(departments) {
  console.log('Seeding students (50 total, evenly distributed)');

  const students = [];
  let serial = 1;

  for (const dept of departments) {
    for (let i = 0; i < 10; i += 1) {
      const name = buildStudentName(serial - 1);
      const emailUser = `${slugifyName(name)}.${dept.code.toLowerCase()}.${String(serial).padStart(3, '0')}`;
      const semester = String((serial % 8) + 1);
      const cgpa = Number((6.2 + (serial % 18) * 0.19).toFixed(2));

      const student = await upsertUserByEmail({
        name,
        email: `${emailUser}@erp.demo.edu`,
        password: DEFAULT_PASSWORD,
        role: USER_ROLES.STUDENT,
        phone: `+91-90030-${String(1000 + serial)}`,
        department: dept._id,
        studentId: `STU-${dept.code}-${String(serial).padStart(3, '0')}`,
        semester,
        section: ['A', 'B', 'C'][serial % 3],
        cgpa,
        skills: [sample(['Python', 'C++', 'CAD', 'MATLAB', 'JavaScript']), sample(['Leadership', 'Teamwork', 'Public Speaking'])],
        projects: [`Mini project ${serial}`, `Lab innovation ${serial}`]
      });

      students.push(student);
      serial += 1;
    }
  }

  return students;
}

function courseTitle(deptCode, type, entryTitle, index) {
  const base = sample(DEPARTMENT_SUBJECTS[deptCode]);
  const typeLabel = normalizeRoleLabel(type).replace('_', ' ');
  return `${base} ${entryTitle} ${index + 1} (${typeLabel})`;
}

async function seedCourses(departments, facultyUsers) {
  console.log('Seeding courses (2 of each type per department => 40 total)');

  const courses = [];
  const facultyByDepartment = new Map();

  for (const dept of departments) {
    facultyByDepartment.set(
      dept.code,
      facultyUsers.filter((f) => f.department && f.department.toString() === dept._id.toString())
    );
  }

  for (const dept of departments) {
    const pool = facultyByDepartment.get(dept.code);

    for (const blueprint of COURSE_BLUEPRINTS) {
      for (let i = 0; i < blueprint.entries.length; i += 1) {
        const entry = blueprint.entries[i];
        const faculty = pool[(i + blueprint.type.length) % pool.length];
        const code = `DUE-${dept.code}-${blueprint.type.slice(0, 3).toUpperCase()}-${i + 1}`;

        const payload = {
          name: courseTitle(dept.code, blueprint.type, entry.title, i),
          code,
          semester: String(DEFAULT_SEMESTER),
          students: 0,
          status: COURSE_STATUS.ACTIVE,
          faculty: faculty._id,
          facultyName: faculty.name,
          description: `Comprehensive ${blueprint.type} course for ${dept.name}.`,
          credits: entry.credits,
          type: blueprint.type,
          department: dept._id,
          maxCapacity: entry.maxCapacity,
          enrolledStudents: [],
          waitlist: [],
          schedule: sample(['Mon-Wed 10:00-11:00', 'Tue-Thu 11:00-12:00', 'Fri 09:00-11:00']),
          room: sample(['A-101', 'B-204', 'Lab-3', 'Seminar Hall 2'])
        };

        const course = await Course.findOneAndUpdate(
          { code },
          { $set: payload },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        courses.push(course);
      }
    }
  }

  return courses;
}

function splitByDepartment(users) {
  const map = new Map();
  for (const user of users) {
    const key = user.department ? user.department.toString() : 'none';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(user);
  }
  return map;
}

async function seedRegistrations(courses, students) {
  console.log('Seeding registrations (students <-> courses)');

  const studentsByDepartment = splitByDepartment(students);

  for (const course of courses) {
    const deptStudents = studentsByDepartment.get(course.department.toString()) || [];
    const registrationCount = Math.min(randomInt(6, 9), deptStudents.length);
    const start = randomInt(0, Math.max(0, deptStudents.length - registrationCount));
    const selected = deptStudents.slice(start, start + registrationCount);

    course.enrolledStudents = selected.map((student) => student._id);
    course.students = course.enrolledStudents.length;

    const waitlistStart = (start + registrationCount) % deptStudents.length;
    const waitlistCandidates = deptStudents.slice(waitlistStart, waitlistStart + randomInt(0, 2));
    course.waitlist = waitlistCandidates.map((student, index) => ({
      student: student._id,
      position: index + 1,
      addedAt: new Date()
    }));

    await course.save();
  }
}

async function seedFeeStructures() {
  console.log('Seeding fee structures');

  const definitions = [
    { type: FEE_TYPES.TUITION, name: 'Tuition Fee', amount: 62000, isOptional: false },
    { type: FEE_TYPES.LIBRARY, name: 'Library Fee', amount: 3000, isOptional: false },
    { type: FEE_TYPES.LABORATORY, name: 'Laboratory Fee', amount: 6000, isOptional: false },
    { type: FEE_TYPES.EXAMINATION, name: 'Examination Fee', amount: 3500, isOptional: false },
    { type: FEE_TYPES.SPORTS, name: 'Sports Activity Fee', amount: 1800, isOptional: true },
    { type: FEE_TYPES.DEVELOPMENT, name: 'Infrastructure Development Fee', amount: 4200, isOptional: false }
  ];

  await FeeStructure.deleteMany({ semester: String(DEFAULT_SEMESTER), academicYear: ACADEMIC_YEAR });

  const records = await FeeStructure.insertMany(
    definitions.map((item) => ({
      ...item,
      description: `${item.name} for semester ${DEFAULT_SEMESTER}`,
      dueDate: new Date('2026-04-25'),
      semester: String(DEFAULT_SEMESTER),
      academicYear: ACADEMIC_YEAR
    }))
  );

  return records;
}

async function seedFeePayments(students, feeStructures) {
  console.log('Seeding fee payments');

  const existingTxnPrefix = `SEED-${ACADEMIC_YEAR.replace('-', '')}`;
  await FeePayment.deleteMany({ transactionId: new RegExp(`^${existingTxnPrefix}`) });

  const docs = [];

  for (let i = 0; i < students.length; i += 1) {
    const student = students[i];

    for (let j = 0; j < feeStructures.length; j += 1) {
      const structure = feeStructures[j];
      const roll = (i + j) % 10;

      let status;
      let paidAmount;

      if (roll < 7) {
        status = PAYMENT_STATUS.PAID;
        paidAmount = structure.amount;
      } else if (roll < 9) {
        status = PAYMENT_STATUS.PARTIAL;
        paidAmount = Math.floor(structure.amount * 0.5);
      } else {
        status = PAYMENT_STATUS.PENDING;
        paidAmount = 0;
      }

      docs.push({
        studentId: student._id,
        feeStructureId: structure._id,
        amount: structure.amount,
        paidAmount,
        paymentDate: new Date(Date.now() - randomInt(2, 60) * 24 * 60 * 60 * 1000),
        transactionId: `${existingTxnPrefix}-${String(i + 1).padStart(3, '0')}-${String(j + 1).padStart(2, '0')}`,
        paymentMethod: sample(Object.values(PAYMENT_METHODS)),
        status,
        semester: String(DEFAULT_SEMESTER),
        academicYear: ACADEMIC_YEAR,
        receiptUrl: status === PAYMENT_STATUS.PAID ? `/receipts/${student.studentId}-${structure.type}.pdf` : undefined
      });
    }
  }

  return FeePayment.insertMany(docs);
}

async function seedNotices(admin, hodsByDepartment) {
  console.log('Seeding notices');

  await Notice.deleteMany({ title: /^\[SEED\]/i });

  const notices = [
    {
      title: '[SEED] Semester Midterm Schedule Published',
      content: 'Midterm exams begin from 20 April 2026. Students should check course-wise slots and reporting times.',
      createdBy: admin._id,
      targetRoles: [USER_ROLES.STUDENT, USER_ROLES.FACULTY, USER_ROLES.HOD],
      priority: PRIORITY_LEVELS.HIGH,
      isRead: false
    },
    {
      title: '[SEED] Fee Reminder for Semester 4',
      content: 'Fee dues must be cleared by 25 April 2026 to avoid late payment penalties.',
      createdBy: admin._id,
      targetRoles: [USER_ROLES.STUDENT],
      priority: PRIORITY_LEVELS.URGENT,
      isRead: false
    }
  ];

  for (const dept of DEPARTMENTS) {
    const hod = hodsByDepartment.get(dept.code);
    if (!hod) continue;

    notices.push({
      title: `[SEED] ${dept.code} Department Lab Advisory`,
      content: `${dept.name} students should complete pending laboratory records before internal assessment week.`,
      createdBy: hod._id,
      targetRoles: [USER_ROLES.STUDENT, USER_ROLES.FACULTY],
      priority: PRIORITY_LEVELS.MEDIUM,
      isRead: false
    });
  }

  return Notice.insertMany(notices);
}

async function seedAssignments(courses) {
  console.log('Seeding assignments');

  await Assignment.deleteMany({ title: /^\[SEED\]/i });

  const assignmentDocs = [];

  for (const course of courses) {
    assignmentDocs.push({
      title: `[SEED] ${course.code} Case Study`,
      courseId: course._id,
      courseName: course.name,
      description: `Applied assignment for ${course.name}.`,
      dueDate: new Date(Date.now() + randomInt(7, 21) * 24 * 60 * 60 * 1000),
      maxMarks: 100,
      submittedCount: 0,
      totalStudents: course.students,
      status: ASSIGNMENT_STATUS.ACTIVE,
      facultyId: course.faculty,
      attachments: [],
      instructions: 'Submit a concise report with references and practical implementation notes.'
    });
  }

  return Assignment.insertMany(assignmentDocs);
}

async function seedAssignmentSubmissions(assignments, students) {
  console.log('Seeding assignment submissions');

  await AssignmentSubmission.deleteMany({ fileUrl: /^\/seed\/assignments\//i });

  const studentsById = new Map(students.map((s) => [s._id.toString(), s]));
  const docs = [];

  for (const assignment of assignments) {
    const course = await Course.findById(assignment.courseId).select('enrolledStudents');
    const enrolled = course ? course.enrolledStudents.slice(0, randomInt(3, 6)) : [];

    for (const studentId of enrolled) {
      const student = studentsById.get(studentId.toString());
      if (!student) continue;

      const marks = randomInt(45, 95);
      docs.push({
        assignmentId: assignment._id,
        studentId: student._id,
        studentName: student.name,
        submittedAt: new Date(Date.now() - randomInt(1, 12) * 24 * 60 * 60 * 1000),
        fileUrl: `/seed/assignments/${assignment._id}-${student.studentId}.pdf`,
        marks,
        feedback: marks > 80 ? 'Excellent structure and analysis.' : 'Good effort, improve depth in references.',
        status: SUBMISSION_STATUS.GRADED
      });
    }
  }

  return AssignmentSubmission.insertMany(docs);
}

async function seedAttendance(courses) {
  console.log('Seeding attendance');

  const courseIds = courses.map((c) => c._id);
  await Attendance.deleteMany({ courseId: { $in: courseIds } });

  const docs = [];

  for (const course of courses) {
    const attendanceDates = [
      new Date('2026-03-20T09:00:00.000Z'),
      new Date('2026-03-27T09:00:00.000Z'),
      new Date('2026-04-03T09:00:00.000Z')
    ];

    for (const date of attendanceDates) {
      for (const studentId of course.enrolledStudents.slice(0, 6)) {
        docs.push({
          studentId,
          courseId: course._id,
          date,
          status: sample([ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.ABSENT, ATTENDANCE_STATUS.LATE]),
          markedBy: course.faculty,
          classType: sample(['lecture', 'tutorial']),
          notes: ''
        });
      }
    }
  }

  return Attendance.insertMany(docs);
}

async function seedStudentResults(courses, students) {
  console.log('Seeding student results');

  const studentIds = students.map((s) => s._id);
  await StudentResult.deleteMany({ studentId: { $in: studentIds }, academicYear: ACADEMIC_YEAR, semester: DEFAULT_SEMESTER });

  const docs = [];

  for (const course of courses) {
    for (const studentId of course.enrolledStudents.slice(0, 6)) {
      const totalMarks = 100;
      const obtainedMarks = randomInt(35, 98);
      const percent = (obtainedMarks / totalMarks) * 100;
      const grading = gradeFromPercentage(percent);

      docs.push({
        studentId,
        courseId: course._id,
        courseName: course.name,
        courseCode: course.code,
        academicYear: ACADEMIC_YEAR,
        semester: DEFAULT_SEMESTER,
        totalMarks,
        obtainedMarks,
        grade: grading.grade,
        gradePoint: grading.gradePoint,
        status: grading.status,
        evaluatedBy: course.faculty,
        evaluatedDate: new Date('2026-04-05T10:00:00.000Z'),
        remarks: grading.status === RESULT_STATUS.PASS ? 'Satisfactory performance' : 'Needs improvement in fundamentals'
      });
    }
  }

  return StudentResult.insertMany(docs);
}

async function seedGrievances(students, admin) {
  console.log('Seeding grievances');

  await Grievance.deleteMany({ subject: /^\[SEED\]/i });

  const sampleStudents = students.filter((_, idx) => idx % 8 === 0);
  const docs = sampleStudents.map((student, idx) => ({
    studentId: student._id,
    category: sample(Object.values(GRIEVANCE_CATEGORIES)),
    subject: `[SEED] Request for support ${idx + 1}`,
    description: 'I need administrative assistance regarding records update and timeline clarity for the current semester.',
    priority: sample([PRIORITY_LEVELS.MEDIUM, PRIORITY_LEVELS.HIGH]),
    status: idx % 3 === 0 ? GRIEVANCE_STATUS.IN_PROGRESS : GRIEVANCE_STATUS.SUBMITTED,
    assignedTo: admin._id,
    attachments: [],
    resolution: idx % 3 === 0 ? 'Assigned for verification and follow-up.' : '',
    resolvedAt: idx % 3 === 0 ? new Date() : undefined
  }));

  return Grievance.insertMany(docs);
}

async function seedActivities(students, facultyUsers) {
  console.log('Seeding extracurricular activities');

  await ExtracurricularActivity.deleteMany({ title: /^\[SEED\]/i });

  const verifier = facultyUsers[0];

  const docs = students
    .filter((_, idx) => idx % 5 === 0)
    .map((student, idx) => ({
      studentId: student._id,
      activityType: sample(Object.values(ACTIVITY_TYPES)),
      title: `[SEED] Activity Record ${idx + 1}`,
      description: 'Participation in an institution-level event focused on collaboration and leadership.',
      organizingBody: 'College Student Affairs Council',
      participationType: sample(Object.values(PARTICIPATION_TYPES)),
      startDate: new Date('2026-02-10T09:00:00.000Z'),
      endDate: new Date('2026-02-12T16:00:00.000Z'),
      hoursInvolved: randomInt(6, 24),
      certificateUrl: `/seed/certificates/${student.studentId}.pdf`,
      skillsGained: ['Leadership', 'Event planning'],
      nepPoints: randomInt(1, 5),
      verificationStatus: idx % 2 === 0 ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.PENDING,
      verifiedBy: idx % 2 === 0 ? verifier._id : undefined,
      academicYear: ACADEMIC_YEAR
    }));

  return ExtracurricularActivity.insertMany(docs);
}

async function seedMentorship(facultyUsers, students) {
  console.log('Seeding mentorship records');

  await MentorshipRecord.deleteMany({ notes: /^\[SEED\]/i });

  const docs = [];

  for (let i = 0; i < students.length; i += 1) {
    if (i % 4 !== 0) continue;

    const mentor = facultyUsers[i % facultyUsers.length];
    const mentee = students[i];

    docs.push({
      mentorId: mentor._id,
      mentorName: mentor.name,
      menteeId: mentee._id,
      menteeName: mentee.name,
      assignedDate: new Date('2026-01-15T10:00:00.000Z'),
      status: MENTORSHIP_STATUS.ACTIVE,
      meetingSchedule: 'Second Friday of every month',
      sessions: [
        {
          date: new Date('2026-02-14T11:00:00.000Z'),
          duration: 45,
          type: SESSION_TYPES.ACADEMIC,
          topics: ['Study planning', 'Course prioritization'],
          outcomes: 'Student agreed to a weekly revision schedule.',
          nextSteps: 'Submit progress summary before next meeting.',
          studentFeedback: {
            rating: randomInt(3, 5),
            comments: 'Session was helpful and actionable.'
          }
        }
      ],
      goals: ['Improve consistency', 'Raise semester GPA'],
      notes: '[SEED] Mentorship relationship generated for testing workflows.'
    });
  }

  return MentorshipRecord.insertMany(docs);
}

async function seedTimetables(departments, courses, admin) {
  console.log('Seeding timetables');

  await Timetable.deleteMany({ academicYear: ACADEMIC_YEAR, semester: DEFAULT_SEMESTER });

  const docs = [];

  for (const dept of departments) {
    const deptCourses = courses
      .filter((course) => course.department.toString() === dept._id.toString())
      .slice(0, 5);

    const schedule = deptCourses.map((course, idx) => ({
      courseId: course._id,
      courseName: course.name,
      courseCode: course.code,
      facultyId: course.faculty,
      facultyName: course.facultyName,
      day: DAYS_OF_WEEK[idx % DAYS_OF_WEEK.length],
      startTime: ['09:00', '10:00', '11:00', '13:00', '14:00'][idx % 5],
      endTime: ['10:00', '11:00', '12:00', '14:00', '15:00'][idx % 5],
      room: sample(['A-101', 'B-201', 'C-301', 'Lab-1']),
      type: sample(Object.values(TIMETABLE_SLOT_TYPES))
    }));

    docs.push({
      departmentId: dept._id,
      semester: DEFAULT_SEMESTER,
      academicYear: ACADEMIC_YEAR,
      schedule,
      createdBy: admin._id,
      status: TIMETABLE_STATUS.PUBLISHED,
      ocrProcessed: true,
      googleCalendarSynced: false
    });
  }

  return Timetable.insertMany(docs);
}

async function seedWorkloadAllocations(facultyUsers, courses, admin) {
  console.log('Seeding workload allocations');

  await WorkloadAllocation.deleteMany({ academicYear: ACADEMIC_YEAR, semester: DEFAULT_SEMESTER });

  const docs = [];

  for (const faculty of facultyUsers) {
    const facultyCourses = courses.filter((course) => course.faculty && course.faculty.toString() === faculty._id.toString());

    const courseLoads = facultyCourses.map((course) => ({
      courseId: course._id,
      courseName: course.name,
      hoursPerWeek: randomInt(2, 4),
      studentCount: course.students,
      courseType: sample(['theory', 'practical', 'tutorial'])
    }));

    const totalHours = courseLoads.reduce((acc, item) => acc + (item.hoursPerWeek || 0), 0);

    docs.push({
      facultyId: faculty._id,
      facultyName: faculty.name,
      academicYear: ACADEMIC_YEAR,
      semester: DEFAULT_SEMESTER,
      courses: courseLoads,
      totalHours,
      maxHours: 20,
      additionalDuties: ['Mentorship', 'Committee coordination'],
      status: TIMETABLE_STATUS.APPROVED,
      approvedBy: admin._id,
      createdBy: admin._id
    });
  }

  return WorkloadAllocation.insertMany(docs);
}

async function seedApprovalRequests(students, facultyUsers, hodsByDepartment) {
  console.log('Seeding approval requests');

  await ApprovalRequest.deleteMany({ title: /^\[SEED\]/i });

  const docs = [];

  for (let i = 0; i < 12; i += 1) {
    const student = students[i];
    const deptCode = DEPARTMENTS.find((d) => d.code === student.studentId.split('-')[1]).code;
    const hod = hodsByDepartment.get(deptCode);
    const faculty = facultyUsers[i % facultyUsers.length];

    const type = sample(Object.values(APPROVAL_TYPES));
    const status = i % 5 === 0 ? APPROVAL_STATUS.APPROVED : APPROVAL_STATUS.PENDING;

    docs.push({
      type,
      requesterId: student._id,
      requesterName: student.name,
      title: `[SEED] Approval Request ${i + 1}`,
      description: 'Request raised for academic process handling and timeline approval.',
      priority: sample([PRIORITY_LEVELS.MEDIUM, PRIORITY_LEVELS.HIGH]),
      status,
      approverLevel: i % 2 === 0 ? APPROVER_LEVELS.HOD : APPROVER_LEVELS.ADMIN,
      currentApprover: i % 2 === 0 ? hod._id : faculty._id,
      approvalHistory: status === APPROVAL_STATUS.APPROVED
        ? [{
            userId: hod._id,
            userName: hod.name,
            action: APPROVAL_ACTIONS.APPROVED,
            timestamp: new Date(Date.now() - 86400000),
            comments: 'Approved for processing.'
          }]
        : [],
      attachments: [],
      deadline: new Date(Date.now() + randomInt(2, 14) * 24 * 60 * 60 * 1000)
    });
  }

  return ApprovalRequest.insertMany(docs);
}

async function seedFiles(admin, students) {
  console.log('Seeding file metadata');

  await File.deleteMany({ fileUrl: /^\/seed\//i });

  const docs = students.slice(0, 10).map((student, idx) => ({
    fileName: `seed-doc-${idx + 1}.pdf`,
    originalName: `student-document-${idx + 1}.pdf`,
    fileUrl: `/seed/documents/${student.studentId}.pdf`,
    fileSize: randomInt(40000, 180000),
    mimeType: 'application/pdf',
    type: sample(['document', 'certificate']),
    uploadedBy: admin._id,
    relatedEntity: 'User',
    relatedEntityId: student._id
  }));

  return File.insertMany(docs);
}

async function updateDepartmentCounts(departments) {
  console.log('Updating department faculty/student counts');

  for (const dept of departments) {
    const facultyCount = await User.countDocuments({ department: dept._id, role: USER_ROLES.FACULTY, isActive: true });
    const studentCount = await User.countDocuments({ department: dept._id, role: USER_ROLES.STUDENT, isActive: true });

    await Department.findByIdAndUpdate(dept._id, {
      $set: {
        facultyCount,
        studentCount,
        isActive: true
      }
    });
  }
}

function printSummary({
  departments,
  admin,
  hodsByDepartment,
  facultyUsers,
  students,
  courses,
  feeStructures,
  feePayments,
  notices,
  assignments,
  submissions,
  attendance,
  results,
  grievances,
  activities,
  mentorship,
  timetables,
  workloads,
  approvals,
  files
}) {
  console.log('\nSeed completed successfully');
  console.log('------------------------------------------');
  console.log(`Admin users: ${admin ? 1 : 0}`);
  console.log(`Departments: ${departments.length}`);
  console.log(`HOD users: ${hodsByDepartment.size}`);
  console.log(`Faculty users: ${facultyUsers.length}`);
  console.log(`Student users: ${students.length}`);
  console.log(`Courses: ${courses.length}`);
  console.log(`Fee structures: ${feeStructures.length}`);
  console.log(`Fee payments: ${feePayments.length}`);
  console.log(`Notices: ${notices.length}`);
  console.log(`Assignments: ${assignments.length}`);
  console.log(`Assignment submissions: ${submissions.length}`);
  console.log(`Attendance records: ${attendance.length}`);
  console.log(`Result records: ${results.length}`);
  console.log(`Grievances: ${grievances.length}`);
  console.log(`Activities: ${activities.length}`);
  console.log(`Mentorship records: ${mentorship.length}`);
  console.log(`Timetables: ${timetables.length}`);
  console.log(`Workload allocations: ${workloads.length}`);
  console.log(`Approval requests: ${approvals.length}`);
  console.log(`File metadata records: ${files.length}`);
  console.log('------------------------------------------');
  console.log('Demo credentials');
  console.log('Admin: admin@erp.demo.edu / Demo@1234');
  console.log('HOD email pattern: hod.*.<dept>@erp.demo.edu / Demo@1234');
  console.log('Faculty email pattern: faculty.*.<dept>@erp.demo.edu / Demo@1234');
  console.log('Student email pattern: <name>.<dept>.<num>@erp.demo.edu / Demo@1234');
}

async function seedDatabase() {
  try {
    console.log('Starting ERP seed process');
    console.log(`Options: clearAll=${OPTIONS.clearAll}`);

    await connectDatabase();

    if (OPTIONS.clearAll) {
      await clearAllData();
    }

    const departments = await seedDepartments();
    const admin = await seedAdmin();
    const hodsByDepartment = await seedHods(departments);
    const facultyUsers = await seedFaculty(departments);
    const students = await seedStudents(departments);
    const courses = await seedCourses(departments, facultyUsers);

    await seedRegistrations(courses, students);
    await updateDepartmentCounts(departments);

    const feeStructures = await seedFeeStructures();
    const feePayments = await seedFeePayments(students, feeStructures);
    const notices = await seedNotices(admin, hodsByDepartment);
    const assignments = await seedAssignments(courses);
    const submissions = await seedAssignmentSubmissions(assignments, students);
    const attendance = await seedAttendance(courses);
    const results = await seedStudentResults(courses, students);
    const grievances = await seedGrievances(students, admin);
    const activities = await seedActivities(students, facultyUsers);
    const mentorship = await seedMentorship(facultyUsers, students);
    const timetables = await seedTimetables(departments, courses, admin);
    const workloads = await seedWorkloadAllocations(facultyUsers, courses, admin);
    const approvals = await seedApprovalRequests(students, facultyUsers, hodsByDepartment);
    const files = await seedFiles(admin, students);

    printSummary({
      departments,
      admin,
      hodsByDepartment,
      facultyUsers,
      students,
      courses,
      feeStructures,
      feePayments,
      notices,
      assignments,
      submissions,
      attendance,
      results,
      grievances,
      activities,
      mentorship,
      timetables,
      workloads,
      approvals,
      files
    });
  } catch (error) {
    console.error('Seeding failed:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

seedDatabase();
