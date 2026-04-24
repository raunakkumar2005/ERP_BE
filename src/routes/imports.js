const express = require('express');
const fs = require('fs');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { uploadSingle } = require('../utils/fileUpload');
const { createTemplateWorkbook, importWorkbookFile } = require('../services/bulkImportService');
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

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value == null) return false;
  return ['true', '1', 'yes', 'y'].includes(String(value).trim().toLowerCase());
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function csvEscape(value) {
  const normalized = value == null ? '' : String(value);
  const escaped = normalized.replace(/"/g, '""');
  if (/[",\n]/.test(escaped)) {
    return `"${escaped}"`;
  }
  return escaped;
}

function flattenRecord(source, prefix = '', target = {}) {
  if (source == null) {
    return target;
  }

  if (Array.isArray(source)) {
    target[prefix || 'value'] = source.map((item) => {
      if (item && typeof item === 'object') {
        return JSON.stringify(item);
      }
      return item;
    }).join('; ');
    return target;
  }

  if (typeof source !== 'object') {
    target[prefix || 'value'] = source;
    return target;
  }

  Object.entries(source).forEach(([key, value]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;

    if (value == null) {
      target[nextPrefix] = '';
      return;
    }

    if (value instanceof Date) {
      target[nextPrefix] = value.toISOString();
      return;
    }

    if (Array.isArray(value)) {
      target[nextPrefix] = value.map((item) => {
        if (item instanceof Date) return item.toISOString();
        if (item && typeof item === 'object') return JSON.stringify(item);
        return item;
      }).join('; ');
      return;
    }

    if (typeof value === 'object') {
      flattenRecord(value, nextPrefix, target);
      return;
    }

    target[nextPrefix] = value;
  });

  return target;
}

const ENTITY_CONFIG = {
  departments: {
    label: 'Departments',
    loader: async ({ skip, limit }) => {
      const query = { isActive: true };
      const [records, total] = await Promise.all([
        Department.find(query).sort({ code: 1 }).skip(skip).limit(limit).lean(),
        Department.countDocuments(query)
      ]);
      return { records, total };
    }
  },
  teachers: {
    label: 'Teachers',
    loader: async ({ skip, limit }) => {
      const query = { role: { $in: ['faculty', 'hod'] }, isActive: true };
      const [records, total] = await Promise.all([
        User.find(query)
          .select('-password -refreshToken')
          .populate('department', 'name code')
          .sort({ employeeId: 1, name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);
      return { records, total };
    }
  },
  students: {
    label: 'Students',
    loader: async ({ skip, limit }) => {
      const query = { role: 'student', isActive: true };
      const [records, total] = await Promise.all([
        User.find(query)
          .select('-password -refreshToken')
          .populate('department', 'name code')
          .sort({ studentId: 1, name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);
      return { records, total };
    }
  },
  courses: {
    label: 'Courses',
    loader: async ({ skip, limit }) => {
      const query = {};
      const [records, total] = await Promise.all([
        Course.find(query)
          .populate('department', 'name code')
          .populate('faculty', 'name employeeId email')
          .sort({ code: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Course.countDocuments(query)
      ]);
      return { records, total };
    }
  },
  registrations: {
    label: 'Registrations',
    loader: async ({ skip, limit }) => {
      const courses = await Course.find({})
        .select('code name enrolledStudents')
        .populate('enrolledStudents', 'name studentId email')
        .lean();

      const registrationRows = [];
      courses.forEach((course) => {
        (course.enrolledStudents || []).forEach((student) => {
          registrationRows.push({
            courseId: course._id,
            courseCode: course.code,
            courseName: course.name,
            studentId: student?._id,
            studentCode: student?.studentId,
            studentName: student?.name,
            studentEmail: student?.email
          });
        });
      });

      const total = registrationRows.length;
      const records = registrationRows.slice(skip, skip + limit);
      return { records, total };
    }
  },
  feeStructures: {
    label: 'Fee Structures',
    loader: async ({ skip, limit }) => {
      const query = {};
      const [records, total] = await Promise.all([
        FeeStructure.find(query).sort({ academicYear: -1, semester: 1, type: 1 }).skip(skip).limit(limit).lean(),
        FeeStructure.countDocuments(query)
      ]);
      return { records, total };
    }
  },
  feePayments: {
    label: 'Fee Payments',
    loader: async ({ skip, limit }) => {
      const query = {};
      const [records, total] = await Promise.all([
        FeePayment.find(query)
          .populate('studentId', 'name studentId email')
          .populate('feeStructureId', 'type name amount semester academicYear')
          .sort({ paymentDate: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        FeePayment.countDocuments(query)
      ]);
      return { records, total };
    }
  },
  timetable: {
    label: 'Timetable',
    loader: async ({ skip, limit }) => {
      const query = {};
      const [records, total] = await Promise.all([
        Timetable.find(query)
          .populate('departmentId', 'name code')
          .populate('createdBy', 'name email')
          .sort({ updatedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Timetable.countDocuments(query)
      ]);
      return { records, total };
    }
  },
  attendance: {
    label: 'Attendance',
    loader: async ({ skip, limit }) => {
      const query = {};
      const [records, total] = await Promise.all([
        Attendance.find(query)
          .populate('studentId', 'name studentId email')
          .populate('courseId', 'name code')
          .populate('markedBy', 'name employeeId email')
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Attendance.countDocuments(query)
      ]);
      return { records, total };
    }
  },
  results: {
    label: 'Results',
    loader: async ({ skip, limit }) => {
      const query = {};
      const [records, total] = await Promise.all([
        StudentResult.find(query)
          .populate('studentId', 'name studentId email')
          .populate('courseId', 'name code')
          .populate('evaluatedBy', 'name employeeId email')
          .sort({ updatedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        StudentResult.countDocuments(query)
      ]);
      return { records, total };
    }
  }
};

async function loadEntityData(entity, options) {
  const config = ENTITY_CONFIG[entity];
  if (!config) {
    throw new ValidationError(`Unsupported entity ${entity}`);
  }
  return config.loader(options);
}

function toCsv(records) {
  const flattened = records.map((record) => flattenRecord(record));
  const headerSet = new Set();
  flattened.forEach((record) => {
    Object.keys(record).forEach((key) => headerSet.add(key));
  });
  const headers = Array.from(headerSet);
  const lines = [headers.map(csvEscape).join(',')];
  flattened.forEach((record) => {
    const row = headers.map((header) => csvEscape(record[header]));
    lines.push(row.join(','));
  });
  return lines.join('\n');
}

// GET /imports/entities - Get supported entities for imported data browsing
router.get('/entities', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const entities = Object.entries(ENTITY_CONFIG).map(([key, config]) => ({
    key,
    label: config.label
  }));

  res.json({
    success: true,
    data: entities
  });
}));

// GET /imports/data/:entity - View imported data for an entity
router.get('/data/:entity', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { entity } = req.params;
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 50), 2000);
  const skip = (page - 1) * limit;

  const { records, total } = await loadEntityData(entity, { skip, limit });

  res.json({
    success: true,
    data: {
      entity,
      total,
      page,
      limit,
      count: records.length,
      records
    }
  });
}));

// GET /imports/export/:entity - Export imported data as JSON or CSV
router.get('/export/:entity', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { entity } = req.params;
  const format = String(req.query.format || 'json').toLowerCase();
  const limit = Math.min(parsePositiveInt(req.query.limit, 5000), 20000);
  const page = parsePositiveInt(req.query.page, 1);
  const skip = (page - 1) * limit;

  const { records, total } = await loadEntityData(entity, { skip, limit });

  if (format === 'csv') {
    const csv = toCsv(records);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${entity}_export.csv`);
    res.send(csv);
    return;
  }

  if (format !== 'json') {
    throw new ValidationError('Unsupported export format. Use json or csv');
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${entity}_export.json`);
  res.send(JSON.stringify({ entity, total, page, limit, count: records.length, records }, null, 2));
}));

// GET /imports/template - Download workbook template
router.get('/template', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const workbook = createTemplateWorkbook();
  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=erp_import_template.xlsx');
  res.send(Buffer.from(buffer));
}));

// POST /imports/workbook - Import workbook data
router.post('/workbook', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    uploadSingle('file')(req, res, async (err) => {
      const cleanup = () => {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      };

      try {
        if (err) {
          throw new ValidationError(err.message);
        }

        if (!req.file) {
          throw new ValidationError('No file uploaded');
        }

        const dryRun = parseBoolean(req.body.dryRun);
        const result = await importWorkbookFile(req.file.path, { dryRun });

        res.status(201).json({
          success: true,
          data: {
            message: dryRun ? 'Import validation completed' : 'Workbook imported successfully',
            ...result
          }
        });
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        cleanup();
      }
    });
  });
}));

module.exports = router;