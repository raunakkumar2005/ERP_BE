const fs = require('fs');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const {
  User,
  Department,
  Course,
  FeeStructure,
  FeePayment,
  Timetable,
  Attendance,
  StudentResult
} = require('../models');
const {
  USER_ROLES,
  COURSE_TYPES,
  COURSE_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  ATTENDANCE_STATUS,
  RESULT_STATUS,
  DAYS_OF_WEEK,
  TIMETABLE_SLOT_TYPES,
  TIMETABLE_STATUS,
  FEE_TYPES
} = require('../config/constants');
const { ValidationError } = require('../middleware/errorHandler');

const SHEETS = {
  departments: 'Departments',
  teachers: 'Teachers',
  students: 'Students',
  courses: 'Courses',
  registrations: 'Registrations',
  feeStructures: 'Fee Structures',
  feePayments: 'Fee Payments',
  timetable: 'Timetable',
  attendance: 'Attendance',
  results: 'Results'
};

const TEMPLATE_COLUMNS = {
  departments: ['departmentCode', 'departmentName', 'hodEmployeeId', 'hodName', 'isActive'],
  teachers: ['employeeId', 'name', 'email', 'phone', 'departmentCode', 'role', 'qualifications', 'specializations', 'experience', 'isActive'],
  students: ['studentId', 'name', 'email', 'phone', 'departmentCode', 'semester', 'section', 'cgpa', 'skills', 'projects', 'isActive'],
  courses: ['courseCode', 'courseName', 'departmentCode', 'semester', 'credits', 'type', 'facultyEmployeeId', 'maxCapacity', 'schedule', 'room', 'description', 'status'],
  registrations: ['studentId', 'courseCode'],
  feeStructures: ['type', 'name', 'amount', 'description', 'isOptional', 'dueDate', 'semester', 'academicYear'],
  feePayments: ['transactionId', 'studentId', 'feeStructureName', 'feeType', 'amount', 'paidAmount', 'paymentDate', 'paymentMethod', 'status', 'semester', 'academicYear', 'receiptUrl'],
  timetable: ['departmentCode', 'semester', 'academicYear', 'day', 'startTime', 'endTime', 'courseCode', 'facultyEmployeeId', 'room', 'slotType', 'status'],
  attendance: ['studentId', 'courseCode', 'date', 'status', 'markedByEmployeeId', 'classType', 'notes'],
  results: ['studentId', 'courseCode', 'academicYear', 'semester', 'totalMarks', 'obtainedMarks', 'grade', 'gradePoint', 'status', 'remarks']
};

const ENUMS = {
  role: Object.values(USER_ROLES),
  courseType: Object.values(COURSE_TYPES),
  courseStatus: Object.values(COURSE_STATUS),
  paymentStatus: Object.values(PAYMENT_STATUS),
  paymentMethod: Object.values(PAYMENT_METHODS),
  attendanceStatus: Object.values(ATTENDANCE_STATUS),
  resultStatus: Object.values(RESULT_STATUS),
  day: DAYS_OF_WEEK,
  slotType: Object.values(TIMETABLE_SLOT_TYPES),
  timetableStatus: Object.values(TIMETABLE_STATUS),
  feeType: Object.values(FEE_TYPES)
};

const EMAIL_PATTERN = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
const DEFAULT_IMPORTED_PASSWORD = 'Demo@1234';

let hashedDefaultImportedPasswordPromise;

function getDefaultImportedPasswordHash() {
  if (!hashedDefaultImportedPasswordPromise) {
    hashedDefaultImportedPasswordPromise = bcrypt.hash(DEFAULT_IMPORTED_PASSWORD, 10);
  }
  return hashedDefaultImportedPasswordPromise;
}

function unwrapCellValue(value) {
  if (value == null) return value;
  if (value instanceof Date) return value;
  if (typeof value !== 'object') return value;

  // ExcelJS may expose typed objects for formula, rich text, and hyperlink cells.
  if (value.result != null) {
    return unwrapCellValue(value.result);
  }

  if (typeof value.text === 'string' && value.text.trim() !== '') {
    return value.text;
  }

  if (Array.isArray(value.richText)) {
    const richText = value.richText.map((entry) => entry?.text || '').join('').trim();
    if (richText) {
      return richText;
    }
  }

  if (typeof value.hyperlink === 'string' && value.hyperlink.trim() !== '') {
    return value.hyperlink;
  }

  return value;
}

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeText(value) {
  if (value == null) return '';
  const unwrapped = unwrapCellValue(value);
  return String(unwrapped == null ? '' : unwrapped).trim();
}

function normalizeBoolean(value, fallback = false) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
  if (['false', 'no', 'n', '0'].includes(normalized)) return false;
  return fallback;
}

function splitList(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value;
  return String(value).split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
}

function addError(errors, sheet, rowNumber, field, message) {
  errors.push({ sheet, rowNumber, field, message });
}

function requireValue(value, field, sheet, rowNumber, errors) {
  if (normalizeText(value)) return true;
  addError(errors, sheet, rowNumber, field, `${field} is required`);
  return false;
}

function createDryRunDoc(payload) {
  return {
    _id: new mongoose.Types.ObjectId(),
    ...payload
  };
}

function generateTeacherCode(name, rowNumber) {
  const prefix = normalizeText(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  return `TCH-${prefix || 'AUTO'}-${String(rowNumber).padStart(3, '0')}`;
}

function generateStudentCode(departmentCode, rowNumber) {
  const prefix = normalizeText(departmentCode)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
  return `STD-${prefix || 'GEN'}-${String(rowNumber).padStart(4, '0')}`;
}

function readRows(worksheet) {
  if (!worksheet) {
    return [];
  }

  const headerRow = worksheet.getRow(1);
  if (!headerRow || headerRow.cellCount === 0) {
    return [];
  }

  const headerMap = [];
  for (let columnIndex = 1; columnIndex <= headerRow.cellCount; columnIndex += 1) {
    headerMap[columnIndex] = normalizeHeader(headerRow.getCell(columnIndex).value);
  }

  if (!headerMap.some(Boolean)) {
    return [];
  }

  const rows = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const record = {};
    let hasValues = false;

    for (let columnIndex = 1; columnIndex <= headerMap.length; columnIndex += 1) {
      const header = headerMap[columnIndex];
      if (!header) continue;

      const cellValue = unwrapCellValue(row.getCell(columnIndex).value);
      record[header] = cellValue;
      if (cellValue != null && normalizeText(cellValue) !== '') {
        hasValues = true;
      }
    }

    if (hasValues) {
      rows.push({ rowNumber, record });
    }
  }

  return rows;
}

function normalizeEnum(value, allowedValues, fallback) {
  const normalizedValue = unwrapCellValue(value);
  if (normalizedValue == null || normalizedValue === '') return fallback;
  const normalized = String(normalizedValue).trim().toLowerCase();
  const canonical = normalized === 'tution' ? 'tuition' : normalized;
  const matched = allowedValues.find((item) => String(item).toLowerCase() === canonical);
  return matched ?? fallback;
}

function normalizeNumber(value, fallback = null) {
  const normalizedValue = unwrapCellValue(value);
  if (normalizedValue == null || normalizedValue === '') return fallback;
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDate(value, fallback = null) {
  const normalizedValue = unwrapCellValue(value);
  if (normalizedValue == null || normalizedValue === '') return fallback;

  if (normalizedValue instanceof Date && !Number.isNaN(normalizedValue.getTime())) return normalizedValue;

  if (typeof normalizedValue === 'number' && Number.isFinite(normalizedValue)) {
    // Excel serial date (1900 date system)
    const millis = Math.round((normalizedValue - 25569) * 86400 * 1000);
    const parsedFromSerial = new Date(millis);
    return Number.isNaN(parsedFromSerial.getTime()) ? fallback : parsedFromSerial;
  }

  if (typeof normalizedValue === 'string') {
    const raw = normalizedValue.trim();
    const parts = raw.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);

    if (parts) {
      const day = Number(parts[1]);
      const month = Number(parts[2]);
      const year = Number(parts[3]);

      const parsedFromDMY = new Date(year, month - 1, day);
      const isValidDMY = parsedFromDMY.getFullYear() === year
        && parsedFromDMY.getMonth() === month - 1
        && parsedFromDMY.getDate() === day;

      if (isValidDMY) {
        return parsedFromDMY;
      }
    }
  }

  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function generateEmail(displayName, fallbackId) {
  const prefix = normalizeText(displayName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
  return `${prefix || fallbackId.toLowerCase()}@erp.local`;
}

async function buildCache() {
  const [departments, teachers, students, courses, feeStructures] = await Promise.all([
    Department.find({}).select('_id code name hodName isActive'),
    User.find({ role: { $in: [USER_ROLES.FACULTY, USER_ROLES.HOD] } }).select('_id name email employeeId department role isActive'),
    User.find({ role: USER_ROLES.STUDENT }).select('_id name email studentId department semester section isActive'),
    Course.find({}).select('_id code name department faculty facultyName semester students enrolledStudents waitlist room status'),
    FeeStructure.find({}).select('_id type name semester academicYear amount')
  ]);

  const cache = {
    departments: new Map(departments.map((department) => [department.code.toUpperCase(), department])),
    teachers: new Map(teachers.filter((teacher) => teacher.employeeId).map((teacher) => [teacher.employeeId.toUpperCase(), teacher])),
    students: new Map(students.filter((student) => student.studentId).map((student) => [student.studentId.toUpperCase(), student])),
    courses: new Map(courses.map((course) => [course.code.toUpperCase(), course])),
    feeStructures: new Map(feeStructures.map((feeStructure) => [`${normalizeText(feeStructure.academicYear)}:${normalizeText(feeStructure.semester)}:${normalizeText(feeStructure.type)}:${normalizeText(feeStructure.name).toLowerCase()}`, feeStructure]))
  };

  return cache;
}

async function upsertDepartment(record, rowNumber, cache, errors, dryRun) {
  const code = normalizeText(record.departmentcode).toUpperCase();
  const name = normalizeText(record.departmentname);

  if (!requireValue(code, 'departmentCode', SHEETS.departments, rowNumber, errors)) return null;
  if (!requireValue(name, 'departmentName', SHEETS.departments, rowNumber, errors)) return null;

  if (dryRun) {
    const simulatedDepartment = createDryRunDoc({
      code,
      name,
      hodName: normalizeText(record.hodname) || undefined,
      isActive: normalizeBoolean(record.isactive, true)
    });

    cache.departments.set(code, simulatedDepartment);
    return simulatedDepartment;
  }

  const department = await Department.findOneAndUpdate(
    { code },
    {
      $set: {
        code,
        name,
        hodName: normalizeText(record.hodname) || undefined,
        isActive: normalizeBoolean(record.isactive, true)
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  cache.departments.set(code, department);
  return department;
}

async function upsertUser(record, rowNumber, cache, errors, dryRun, role) {
  const isTeacher = role === USER_ROLES.FACULTY || role === USER_ROLES.HOD;
  const departmentCode = normalizeText(record.departmentcode).toUpperCase();
  const department = departmentCode ? cache.departments.get(departmentCode) : null;
  const name = normalizeText(record.name);
  const code = normalizeText(isTeacher ? record.employeeid : record.studentid).toUpperCase() || (isTeacher ? generateTeacherCode(name, rowNumber) : generateStudentCode(departmentCode, rowNumber));
  const email = normalizeText(record.email) || generateEmail(name, code);

  if (!requireValue(name, 'name', isTeacher ? SHEETS.teachers : SHEETS.students, rowNumber, errors)) return null;
  if (!requireValue(email, 'email', isTeacher ? SHEETS.teachers : SHEETS.students, rowNumber, errors)) return null;
  if (!EMAIL_PATTERN.test(email)) {
    addError(errors, isTeacher ? SHEETS.teachers : SHEETS.students, rowNumber, 'email', 'Invalid email format');
    return null;
  }

  if (departmentCode && !department) {
    addError(errors, isTeacher ? SHEETS.teachers : SHEETS.students, rowNumber, 'departmentCode', `Unknown department code ${departmentCode}`);
    return null;
  }

  const payload = {
    name,
    email,
    role,
    phone: normalizeText(record.phone) || undefined,
    department: department ? department._id : null,
    employeeId: isTeacher ? code : undefined,
    studentId: !isTeacher ? code : undefined,
    qualifications: splitList(record.qualifications),
    specializations: splitList(record.specializations),
    experience: normalizeText(record.experience) || undefined,
    semester: normalizeText(record.semester) || undefined,
    section: normalizeText(record.section) || undefined,
    cgpa: normalizeNumber(record.cgpa, undefined),
    skills: splitList(record.skills),
    projects: splitList(record.projects),
    isActive: normalizeBoolean(record.isactive, true)
  };

  if (dryRun) {
    const simulatedUser = createDryRunDoc(payload);
    if (isTeacher) {
      cache.teachers.set(code, simulatedUser);
    } else {
      cache.students.set(code, simulatedUser);
    }
    return simulatedUser;
  }

  const query = isTeacher ? { employeeId: code } : { studentId: code };
  const defaultPasswordHash = await getDefaultImportedPasswordHash();
  const user = await User.findOneAndUpdate(
    query,
    {
      $set: payload,
      $setOnInsert: { password: defaultPasswordHash }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  if (isTeacher) {
    cache.teachers.set(code, user);
  } else {
    cache.students.set(code, user);
  }

  return user;
}

async function upsertCourse(record, rowNumber, cache, errors, dryRun) {
  const code = normalizeText(record.coursecode).toUpperCase();
  const departmentCode = normalizeText(record.departmentcode).toUpperCase();
  const facultyCode = normalizeText(record.facultyemployeeid).toUpperCase();
  const department = cache.departments.get(departmentCode);
  const faculty = facultyCode ? cache.teachers.get(facultyCode) : null;

  if (!requireValue(code, 'courseCode', SHEETS.courses, rowNumber, errors)) return null;
  if (!requireValue(normalizeText(record.coursename), 'courseName', SHEETS.courses, rowNumber, errors)) return null;
  if (!department) {
    addError(errors, SHEETS.courses, rowNumber, 'departmentCode', `Unknown department code ${departmentCode}`);
    return null;
  }
  if (facultyCode && !faculty) {
    addError(errors, SHEETS.courses, rowNumber, 'facultyEmployeeId', `Unknown teacher code ${facultyCode}`);
    return null;
  }

  const payload = {
    name: normalizeText(record.coursename),
    code,
    semester: normalizeText(record.semester),
    credits: normalizeNumber(record.credits, 0),
    type: normalizeEnum(record.type, ENUMS.courseType, COURSE_TYPES.CORE),
    department: department._id,
    maxCapacity: normalizeNumber(record.maxcapacity, 60),
    faculty: faculty ? faculty._id : undefined,
    facultyName: faculty ? faculty.name : undefined,
    schedule: normalizeText(record.schedule) || undefined,
    room: normalizeText(record.room) || undefined,
    description: normalizeText(record.description) || undefined,
    status: normalizeEnum(record.status, ENUMS.courseStatus, COURSE_STATUS.ACTIVE)
  };

  if (dryRun) {
    const simulatedCourse = createDryRunDoc(payload);
    cache.courses.set(code, simulatedCourse);
    return simulatedCourse;
  }

  const course = await Course.findOneAndUpdate(
    { code },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  cache.courses.set(code, course);
  return course;
}

async function upsertRegistrations(record, rowNumber, cache, errors, dryRun) {
  const studentCode = normalizeText(record.studentid).toUpperCase();
  const courseCode = normalizeText(record.coursecode).toUpperCase();
  const student = cache.students.get(studentCode);
  const course = cache.courses.get(courseCode);

  if (!student) {
    addError(errors, SHEETS.registrations, rowNumber, 'studentId', `Unknown student ID ${studentCode}`);
    return null;
  }
  if (!course) {
    addError(errors, SHEETS.registrations, rowNumber, 'courseCode', `Unknown course code ${courseCode}`);
    return null;
  }

  if (dryRun) {
    return { studentId: student._id, courseId: course._id };
  }

  if (!course.enrolledStudents.some((studentId) => studentId.toString() === student._id.toString())) {
    course.enrolledStudents.push(student._id);
    course.students = course.enrolledStudents.length;
    await course.save();
  }

  return course;
}

async function upsertFeeStructure(record, rowNumber, cache, errors, dryRun) {
  const type = normalizeText(record.type).toLowerCase();
  const name = normalizeText(record.name);
  const semester = normalizeText(record.semester);
  const academicYear = normalizeText(record.academicyear);

  if (!normalizeEnum(type, ENUMS.feeType, null)) {
    addError(errors, SHEETS.feeStructures, rowNumber, 'type', `Invalid fee type. Allowed: ${ENUMS.feeType.join(', ')}`);
    return null;
  }
  if (!requireValue(name, 'name', SHEETS.feeStructures, rowNumber, errors)) return null;
  if (!requireValue(semester, 'semester', SHEETS.feeStructures, rowNumber, errors)) return null;
  if (!requireValue(academicYear, 'academicYear', SHEETS.feeStructures, rowNumber, errors)) return null;

  const payload = {
    type,
    name,
    amount: normalizeNumber(record.amount, 0),
    description: normalizeText(record.description) || undefined,
    isOptional: normalizeBoolean(record.isoptional, false),
    dueDate: normalizeDate(record.duedate) || undefined,
    semester,
    academicYear
  };

  if (dryRun) {
    const simulatedFeeStructure = createDryRunDoc(payload);
    cache.feeStructures.set(`${academicYear}:${semester}:${type}:${name.toLowerCase()}`, simulatedFeeStructure);
    return simulatedFeeStructure;
  }

  const feeStructure = await FeeStructure.findOneAndUpdate(
    { type, name, semester, academicYear },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  cache.feeStructures.set(`${academicYear}:${semester}:${type}:${name.toLowerCase()}`, feeStructure);
  return feeStructure;
}

async function upsertFeePayment(record, rowNumber, cache, errors, dryRun) {
  const transactionId = normalizeText(record.transactionid) || `TXN-${rowNumber}`;
  const studentCode = normalizeText(record.studentid).toUpperCase();
  const feeStructureName = normalizeText(record.feestructurename).toLowerCase();
  const feeType = normalizeText(record.feetype).toLowerCase();
  const semester = normalizeText(record.semester);
  const academicYear = normalizeText(record.academicyear);
  const student = cache.students.get(studentCode);
  const feeStructure = cache.feeStructures.get(`${academicYear}:${semester}:${feeType}:${feeStructureName}`)
    || [...cache.feeStructures.values()].find((item) => (
      normalizeText(item.type).toLowerCase() === feeType
      && normalizeText(item.semester) === semester
      && normalizeText(item.academicYear) === academicYear
      && normalizeText(item.name).toLowerCase() === feeStructureName
    ))
    || [...cache.feeStructures.values()].find((item) => (
      normalizeText(item.type).toLowerCase() === feeType
      && normalizeText(item.semester) === semester
      && normalizeText(item.academicYear) === academicYear
    ));

  if (!student) {
    addError(errors, SHEETS.feePayments, rowNumber, 'studentId', `Unknown student ID ${studentCode}`);
    return null;
  }
  if (!feeStructure) {
    addError(errors, SHEETS.feePayments, rowNumber, 'feeStructureName', `Unknown fee structure ${feeStructureName || feeType}`);
    return null;
  }

  const payload = {
    studentId: student._id,
    feeStructureId: feeStructure._id,
    amount: normalizeNumber(record.amount, feeStructure.amount),
    paidAmount: normalizeNumber(record.paidamount, 0),
    paymentDate: normalizeDate(record.paymentdate) || new Date(),
    transactionId,
    paymentMethod: normalizeEnum(record.paymentmethod, ENUMS.paymentMethod, PAYMENT_METHODS.CASH),
    status: normalizeEnum(record.status, ENUMS.paymentStatus, PAYMENT_STATUS.PENDING),
    receiptUrl: normalizeText(record.receipturl) || undefined,
    semester,
    academicYear
  };

  if (dryRun) {
    return payload;
  }

  return FeePayment.findOneAndUpdate(
    { transactionId },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function upsertTimetable(record, rowNumber, cache, errors, dryRun) {
  const departmentCode = normalizeText(record.departmentcode).toUpperCase();
  const semester = normalizeText(record.semester);
  const academicYear = normalizeText(record.academicyear);
  const day = normalizeText(record.day).toLowerCase();
  const courseCode = normalizeText(record.coursecode).toUpperCase();
  const facultyCode = normalizeText(record.facultyemployeeid).toUpperCase();
  const department = cache.departments.get(departmentCode);
  const course = cache.courses.get(courseCode);
  const faculty = facultyCode ? cache.teachers.get(facultyCode) : null;

  if (!department) {
    addError(errors, SHEETS.timetable, rowNumber, 'departmentCode', `Unknown department code ${departmentCode}`);
    return null;
  }
  if (!course) {
    addError(errors, SHEETS.timetable, rowNumber, 'courseCode', `Unknown course code ${courseCode}`);
    return null;
  }
  if (!normalizeEnum(day, ENUMS.day, null)) {
    addError(errors, SHEETS.timetable, rowNumber, 'day', `Invalid day. Allowed: ${ENUMS.day.join(', ')}`);
    return null;
  }

  const slotType = normalizeEnum(record.slottype, ENUMS.slotType, TIMETABLE_SLOT_TYPES.LECTURE);
  if (!requireValue(semester, 'semester', SHEETS.timetable, rowNumber, errors)) return null;
  if (!requireValue(academicYear, 'academicYear', SHEETS.timetable, rowNumber, errors)) return null;

  const slot = {
    courseId: course._id,
    courseName: course.name,
    courseCode: course.code,
    facultyId: faculty ? faculty._id : course.faculty,
    facultyName: faculty ? faculty.name : course.facultyName,
    day,
    startTime: normalizeText(record.starttime),
    endTime: normalizeText(record.endtime),
    room: normalizeText(record.room) || course.room || undefined,
    type: slotType
  };

  if (!slot.startTime || !slot.endTime) {
    addError(errors, SHEETS.timetable, rowNumber, 'startTime', 'startTime and endTime are required');
    return null;
  }

  if (dryRun) {
    return slot;
  }

  const timetable = await Timetable.findOneAndUpdate(
    { departmentId: department._id, semester, academicYear },
    {
      $setOnInsert: {
        departmentId: department._id,
        semester,
        academicYear,
        createdBy: null,
        status: TIMETABLE_STATUS.DRAFT
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const duplicateSlot = timetable.schedule.some((item) => (
    normalizeText(item.courseCode).toUpperCase() === slot.courseCode
    && normalizeText(item.day).toLowerCase() === slot.day
    && normalizeText(item.startTime) === slot.startTime
    && normalizeText(item.endTime) === slot.endTime
    && normalizeText(item.room) === normalizeText(slot.room)
  ));

  if (!duplicateSlot) {
    timetable.schedule.push(slot);
    await timetable.save();
  }

  cache.timetable = cache.timetable || new Map();
  cache.timetable.set(`${department._id.toString()}:${semester}:${academicYear}`, timetable);
  return timetable;
}

async function upsertAttendance(record, rowNumber, cache, errors, dryRun) {
  const studentCode = normalizeText(record.studentid).toUpperCase();
  const courseCode = normalizeText(record.coursecode).toUpperCase();
  const student = cache.students.get(studentCode);
  const course = cache.courses.get(courseCode);
  const date = normalizeDate(record.date);
  const markedByCode = normalizeText(record.markedbyemployeeid).toUpperCase();
  const markedBy = markedByCode ? cache.teachers.get(markedByCode) : null;

  if (!student) {
    addError(errors, SHEETS.attendance, rowNumber, 'studentId', `Unknown student ID ${studentCode}`);
    return null;
  }
  if (!course) {
    addError(errors, SHEETS.attendance, rowNumber, 'courseCode', `Unknown course code ${courseCode}`);
    return null;
  }
  if (!date) {
    addError(errors, SHEETS.attendance, rowNumber, 'date', 'Invalid date');
    return null;
  }

  const payload = {
    studentId: student._id,
    courseId: course._id,
    date,
    status: normalizeEnum(record.status, ENUMS.attendanceStatus, ATTENDANCE_STATUS.PRESENT),
    markedBy: markedBy ? markedBy._id : course.faculty,
    classType: normalizeText(record.classtype) || 'lecture',
    notes: normalizeText(record.notes) || undefined
  };

  if (dryRun) {
    return payload;
  }

  return Attendance.findOneAndUpdate(
    { studentId: payload.studentId, courseId: payload.courseId, date: payload.date },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function upsertResult(record, rowNumber, cache, errors, dryRun) {
  const studentCode = normalizeText(record.studentid).toUpperCase();
  const courseCode = normalizeText(record.coursecode).toUpperCase();
  const student = cache.students.get(studentCode);
  const course = cache.courses.get(courseCode);

  if (!student) {
    addError(errors, SHEETS.results, rowNumber, 'studentId', `Unknown student ID ${studentCode}`);
    return null;
  }
  if (!course) {
    addError(errors, SHEETS.results, rowNumber, 'courseCode', `Unknown course code ${courseCode}`);
    return null;
  }

  const payload = {
    studentId: student._id,
    courseId: course._id,
    courseName: course.name,
    courseCode: course.code,
    academicYear: normalizeText(record.academicyear),
    semester: normalizeNumber(record.semester, 0),
    totalMarks: normalizeNumber(record.totalmarks, 0),
    obtainedMarks: normalizeNumber(record.obtainedmarks, 0),
    grade: normalizeText(record.grade) || undefined,
    gradePoint: normalizeNumber(record.gradepoint, undefined),
    status: normalizeEnum(record.status, ENUMS.resultStatus, RESULT_STATUS.PENDING),
    evaluatedBy: cache.teachers.get(normalizeText(record.evaluatedbyemployeeid).toUpperCase())?._id || course.faculty,
    evaluatedDate: normalizeDate(record.evaluateddate) || undefined,
    remarks: normalizeText(record.remarks) || undefined
  };

  if (!payload.academicYear || !payload.semester) {
    addError(errors, SHEETS.results, rowNumber, 'semester', 'academicYear and semester are required');
    return null;
  }

  if (dryRun) {
    return payload;
  }

  return StudentResult.findOneAndUpdate(
    { studentId: payload.studentId, courseId: payload.courseId },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

function createTemplateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ERP Importer';
  workbook.created = new Date();

  Object.entries(TEMPLATE_COLUMNS).forEach(([sheetKey, columns]) => {
    const sheet = workbook.addWorksheet(SHEETS[sheetKey]);
    sheet.addRow(columns);
    sheet.getRow(1).font = { bold: true };
    sheet.columns = columns.map((column) => ({ header: column, key: column, width: Math.max(column.length + 4, 16) }));
  });

  return workbook;
}

async function importWorkbookFile(filePath, { dryRun = false } = {}) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new ValidationError('Import file not found');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const cache = await buildCache();
  const errors = [];
  const summary = {
    departments: 0,
    teachers: 0,
    students: 0,
    courses: 0,
    registrations: 0,
    feeStructures: 0,
    feePayments: 0,
    timetable: 0,
    attendance: 0,
    results: 0
  };

  const importPlan = [
    ['departments', readRows(workbook.getWorksheet(SHEETS.departments)), upsertDepartment],
    ['teachers', readRows(workbook.getWorksheet(SHEETS.teachers)), (record, rowNumber, currentCache, currentErrors, currentDryRun) => upsertUser(record, rowNumber, currentCache, currentErrors, currentDryRun, USER_ROLES.FACULTY)],
    ['students', readRows(workbook.getWorksheet(SHEETS.students)), (record, rowNumber, currentCache, currentErrors, currentDryRun) => upsertUser(record, rowNumber, currentCache, currentErrors, currentDryRun, USER_ROLES.STUDENT)],
    ['courses', readRows(workbook.getWorksheet(SHEETS.courses)), upsertCourse],
    ['registrations', readRows(workbook.getWorksheet(SHEETS.registrations)), upsertRegistrations],
    ['feeStructures', readRows(workbook.getWorksheet(SHEETS.feeStructures)), upsertFeeStructure],
    ['feePayments', readRows(workbook.getWorksheet(SHEETS.feePayments)), upsertFeePayment],
    ['timetable', readRows(workbook.getWorksheet(SHEETS.timetable)), upsertTimetable],
    ['attendance', readRows(workbook.getWorksheet(SHEETS.attendance)), upsertAttendance],
    ['results', readRows(workbook.getWorksheet(SHEETS.results)), upsertResult]
  ];

  for (const [summaryKey, rows, handler] of importPlan) {
    for (const { rowNumber, record } of rows) {
      const result = await handler(record, rowNumber, cache, errors, dryRun);
      if (result) {
        summary[summaryKey] += 1;
      }
    }
  }

  if (errors.length > 0) {
    const error = new ValidationError('Import validation failed', errors);
    error.details = errors;
    throw error;
  }

  return {
    dryRun,
    summary,
    errors: [],
    sheets: workbook.worksheets.map((sheet) => sheet.name)
  };
}

module.exports = {
  SHEETS,
  createTemplateWorkbook,
  importWorkbookFile
};