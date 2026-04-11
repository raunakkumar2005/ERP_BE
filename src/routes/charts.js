const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const StudentResult = require('../models/StudentResult');
const Department = require('../models/Department');
const Course = require('../models/Course');

/**
 * GET /api/charts/enrollment-trends
 * Get enrollment trends over time (monthly/yearly)
 */
router.get('/enrollment-trends', authenticate, asyncHandler(async (req, res) => {
  const { timeframe = 'year', departmentId } = req.query;
  
  const matchStage = { role: 'student', isActive: true };
  if (departmentId) {
    matchStage.department = departmentId;
  }

  let dateFormat;
  let groupBy;
  
  if (timeframe === 'month') {
    dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    groupBy = { yearMonth: '$_id' };
  } else {
    dateFormat = { $year: '$createdAt' };
    groupBy = { year: '$_id' };
  }

  const trends = await User.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: dateFormat,
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        period: groupBy.count ? '$_id' : '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  // If yearly, reformat properly
  const formattedTrends = trends.map(t => ({
    period: timeframe === 'month' ? t.period.yearMonth : t.period.year,
    count: t.count
  }));

  res.json({ 
    success: true, 
    data: formattedTrends,
    timeframe 
  });
}));

/**
 * GET /api/charts/attendance-overview
 * Get attendance overview with overall stats and trends
 */
router.get('/attendance-overview', authenticate, asyncHandler(async (req, res) => {
  const { departmentId, courseId, startDate, endDate } = req.query;
  
  const matchStage = {};
  if (departmentId) matchStage.departmentId = departmentId;
  if (courseId) matchStage.courseId = courseId;
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  // Overall attendance stats
  const overallStats = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
      }
    }
  ]);

  // Monthly attendance trends
  const monthlyTrends = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        total: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Format monthly trends with percentage
  const trends = monthlyTrends.map(m => ({
    month: m._id,
    present: m.present,
    absent: m.absent,
    late: m.late,
    total: m.total,
    attendanceRate: m.total > 0 ? Math.round(((m.present + m.late * 0.5) / m.total) * 100) : 0
  }));

  const stats = overallStats[0] || { total: 0, present: 0, absent: 0, late: 0 };
  const overallRate = stats.total > 0 
    ? Math.round(((stats.present + stats.late * 0.5) / stats.total) * 100) 
    : 0;

  res.json({
    success: true,
    data: {
      overall: {
        total: stats.total,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        attendanceRate: overallRate
      },
      trends
    }
  });
}));

/**
 * GET /api/charts/grade-distribution
 * Get grade distribution for courses/semesters
 */
router.get('/grade-distribution', authenticate, asyncHandler(async (req, res) => {
  const { courseId, semester, academicYear } = req.query;
  
  const matchStage = {};
  if (courseId) matchStage.courseId = courseId;
  if (semester) matchStage.semester = parseInt(semester);
  if (academicYear) matchStage.academicYear = academicYear;

  // Get grade distribution
  const distribution = await StudentResult.aggregate([
    { $match: matchStage },
    { $group: { _id: '$grade', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  // Get grade-wise statistics
  const gradeStats = await StudentResult.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$grade',
        count: { $sum: 1 },
        avgMarks: { $avg: '$obtainedMarks' },
        maxMarks: { $max: '$obtainedMarks' },
        minMarks: { $min: '$obtainedMarks' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Calculate pass/fail stats
  const passFailStats = await StudentResult.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const passCount = passFailStats.find(s => s._id === 'pass')?.count || 0;
  const failCount = passFailStats.find(s => s._id === 'fail')?.count || 0;
  const total = passCount + failCount;
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;

  const formattedDistribution = gradeStats.map(g => ({
    grade: g._id || 'N/A',
    count: g.count,
    avgMarks: Math.round(g.avgMarks * 100) / 100,
    maxMarks: g.maxMarks,
    minMarks: g.minMarks
  }));

  res.json({
    success: true,
    data: {
      distribution: formattedDistribution,
      summary: {
        total,
        passCount,
        failCount,
        passRate
      }
    }
  });
}));

/**
 * GET /api/charts/department-performance
 * Get performance metrics by department
 */
router.get('/department-performance', authenticate, asyncHandler(async (req, res) => {
  const { academicYear, semester } = req.query;

  // Get all active departments with their basic info
  const departments = await Department.find({ isActive: true })
    .select('name code _id')
    .lean();

  // Build match stage for results
  const resultMatchStage = {};
  if (academicYear) resultMatchStage.academicYear = academicYear;
  if (semester) resultMatchStage.semester = parseInt(semester);

  // Get performance data for each department
  const departmentPerformance = await Promise.all(
    departments.map(async (dept) => {
      // Get student count
      const studentCount = await User.countDocuments({ 
        department: dept._id, 
        role: 'student', 
        isActive: true 
      });

      // Get faculty count
      const facultyCount = await User.countDocuments({ 
        department: dept._id, 
        role: { $in: ['faculty', 'hod'] }, 
        isActive: true 
      });

      // Get course count
      const courseCount = await Course.countDocuments({ department: dept._id });

      // Get average attendance for department
      const attendanceStats = await Attendance.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: '$student' },
        { $match: { 'student.department': dept._id } },
        {
          $group: {
            _id: null,
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            total: { $sum: 1 }
          }
        }
      ]);

      const attendanceRate = attendanceStats.length > 0 && attendanceStats[0].total > 0
        ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100)
        : 0;

      // Get academic performance
      const courseIds = await Course.find({ department: dept._id }).distinct('_id');
      const academicMatch = { 
        ...resultMatchStage,
        courseId: { $in: courseIds }
      };

      const academicStats = await StudentResult.aggregate([
        { $match: academicMatch },
        {
          $group: {
            _id: null,
            avgMarks: { $avg: '$obtainedMarks' },
            passCount: { $sum: { $cond: [{ $eq: ['$status', 'pass'] }, 1, 0] } },
            total: { $sum: 1 }
          }
        }
      ]);

      const avgMarks = academicStats[0]?.avgMarks || 0;
      const passRate = academicStats[0]?.total > 0
        ? Math.round((academicStats[0].passCount / academicStats[0].total) * 100)
        : 0;

      return {
        department: {
          id: dept._id,
          name: dept.name,
          code: dept.code
        },
        metrics: {
          studentCount,
          facultyCount,
          courseCount,
          attendanceRate,
          avgMarks: Math.round(avgMarks * 100) / 100,
          passRate
        }
      };
    })
  );

  // Calculate overall averages
  const overallAvgAttendance = departmentPerformance.length > 0
    ? Math.round(departmentPerformance.reduce((sum, d) => sum + d.metrics.attendanceRate, 0) / departmentPerformance.length)
    : 0;
  
  const overallAvgMarks = departmentPerformance.length > 0
    ? Math.round(departmentPerformance.reduce((sum, d) => sum + d.metrics.avgMarks, 0) / departmentPerformance.length * 100) / 100
    : 0;

  const overallPassRate = departmentPerformance.length > 0
    ? Math.round(departmentPerformance.reduce((sum, d) => sum + d.metrics.passRate, 0) / departmentPerformance.length)
    : 0;

  res.json({
    success: true,
    data: {
      departments: departmentPerformance,
      summary: {
        totalDepartments: departments.length,
        avgAttendanceRate: overallAvgAttendance,
        avgMarks: overallAvgMarks,
        avgPassRate: overallPassRate
      }
    }
  });
}));

module.exports = router;
