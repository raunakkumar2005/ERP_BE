const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const analyticsService = require('../services/analyticsService');
const reportService = require('../services/reportService');

// GET /analytics/dashboard - Get dashboard analytics
router.get('/dashboard', authenticate, asyncHandler(async (req, res) => {
  const { period } = req.query;
  const stats = await analyticsService.getDashboardAnalytics(req.user, period);
  res.json({ success: true, data: stats });
}));

// GET /analytics/attendance - Get attendance analytics
router.get('/attendance', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const { departmentId, courseId, startDate, endDate } = req.query;
  const stats = await analyticsService.getAttendanceAnalytics({
    departmentId,
    courseId,
    startDate,
    endDate
  });
  res.json({ success: true, data: stats });
}));

// GET /analytics/academic - Get academic performance
router.get('/academic', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const stats = await analyticsService.getAcademicPerformanceAnalytics(departmentId);
  res.json({ success: true, data: stats });
}));

// GET /analytics/department - Get department overview
router.get('/department', authenticate, authorize('hod'), asyncHandler(async (req, res) => {
  const stats = await analyticsService.getDepartmentOverview(req.user.department);
  res.json({ success: true, data: stats });
}));

// GET /analytics/system - Get system usage (Admin only)
router.get('/system', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const stats = await analyticsService.getSystemUsageAnalytics();
  res.json({ success: true, data: stats });
}));

// GET /analytics/enrollment - Get enrollment trends
router.get('/enrollment', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const { departmentId, timeframe } = req.query;
  const trends = await analyticsService.getEnrollmentTrends(departmentId, timeframe);
  res.json({ success: true, data: trends });
}));

// GET /analytics/grades - Get grade distribution
router.get('/grades', authenticate, authorize('admin', 'hod', 'faculty'), asyncHandler(async (req, res) => {
  const { courseId, semester, academicYear } = req.query;
  const distribution = await analyticsService.getGradeDistribution(courseId, semester, academicYear);
  res.json({ success: true, data: distribution });
}));

// GET /analytics/fees - Get fee collection report
router.get('/fees', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const report = await analyticsService.getFeeCollectionReport(departmentId);
  res.json({ success: true, data: report });
}));

// GET /analytics/notices - Get notice analytics
router.get('/notices', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const stats = await analyticsService.getNoticeAnalytics();
  res.json({ success: true, data: stats });
}));

// GET /analytics/approvals - Get approval analytics
router.get('/approvals', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const stats = await analyticsService.getApprovalAnalytics();
  res.json({ success: true, data: stats });
}));

// GET /analytics/nep - Get NEP 2020 assessment (Student)
router.get('/nep', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  const { includeSkillAssessment, includeCompetencyMapping } = req.query;
  const assessment = await analyticsService.getNEPAssessment(req.user._id, {
    includeSkillAssessment: includeSkillAssessment === 'true',
    includeCompetencyMapping: includeCompetencyMapping === 'true'
  });
  res.json({ success: true, data: assessment });
}));

// ============ REPORT ENDPOINTS ============

// GET /reports/marksheet - Generate marksheet
router.get('/reports/marksheet', authenticate, asyncHandler(async (req, res) => {
  const { studentId, semester, academicYear } = req.query;
  
  // Students can only get their own marksheet
  if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const result = await reportService.generateMarksheet(studentId, semester, academicYear);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(Buffer.from(result.buffer));
}));

// GET /reports/attendance - Generate attendance report
router.get('/reports/attendance', authenticate, authorize('admin', 'hod', 'faculty'), asyncHandler(async (req, res) => {
  const { courseId, startDate, endDate } = req.query;
  const result = await reportService.generateAttendanceReport(courseId, startDate, endDate);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(Buffer.from(result.buffer));
}));

// GET /reports/fees - Generate fee report
router.get('/reports/fees', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const { departmentId, semester, academicYear } = req.query;
  const result = await reportService.generateFeeReport(departmentId, semester, academicYear);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(Buffer.from(result.buffer));
}));

// GET /reports/workload - Generate workload report
router.get('/reports/workload', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const { departmentId, academicYear } = req.query;
  const result = await reportService.generateWorkloadReport(departmentId, academicYear);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(Buffer.from(result.buffer));
}));

// GET /reports/grades - Generate grade distribution
router.get('/reports/grades', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const { courseId, semester, academicYear } = req.query;
  const result = await reportService.generateGradeReport(courseId, semester, academicYear);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(Buffer.from(result.buffer));
}));

// GET /reports/students - Generate student list
router.get('/reports/students', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const result = await reportService.generateStudentList(departmentId);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(Buffer.from(result.buffer));
}));

// GET /reports/transcript - Generate academic transcript
router.get('/reports/transcript', authenticate, asyncHandler(async (req, res) => {
  const { studentId } = req.query;
  
  // Students can only get their own transcript
  if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const result = await reportService.generateAcademicTranscript(studentId);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(Buffer.from(result.buffer));
}));

module.exports = router;
