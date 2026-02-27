const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, attendanceSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// GET /attendance/student/:studentId - Get student attendance
router.get('/student/:studentId', authenticate, asyncHandler(async (req, res) => {
  const { courseId, startDate, endDate } = req.query;
  const query = { studentId: req.params.studentId };
  if (courseId) query.courseId = courseId;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  const records = await Attendance.find(query)
    .populate('courseId', 'name code')
    .sort({ date: -1 });
    
  const totalClasses = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const percentage = totalClasses > 0 ? ((present + late * 0.5) / totalClasses) * 100 : 0;
  
  res.json({
    success: true,
    data: { records, summary: { totalClasses, present, absent, late, percentage } }
  });
}));

// GET /attendance/course/:courseId - Get course attendance (Faculty only)
router.get('/course/:courseId', authenticate, authorize('faculty', 'admin', 'hod'), asyncHandler(async (req, res) => {
  const records = await Attendance.find({ courseId: req.params.courseId })
    .populate('studentId', 'name email studentId')
    .sort({ date: -1 });
  
  res.json({ success: true, data: { records } });
}));

// POST /attendance/mark - Mark attendance (Faculty only)
router.post('/mark', authenticate, authorize('faculty'), validate(attendanceSchemas.mark), asyncHandler(async (req, res) => {
  const { courseId, date, students } = req.body;
  const operations = students.map(s => ({
    updateOne: {
      filter: { studentId: s.studentId, courseId, date: new Date(date) },
      update: { $set: { status: s.status, markedBy: req.user._id } },
      upsert: true
    }
  }));
  
  await Attendance.bulkWrite(operations);
  res.json({ success: true, data: { message: 'Attendance marked successfully', markedCount: students.length } });
}));

// PUT /attendance/:id - Update attendance record
router.put('/:id', authenticate, authorize('faculty'), validate(attendanceSchemas.update), asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!attendance) throw new NotFoundError('Attendance record not found');
  res.json({ success: true, data: attendance });
}));

// GET /attendance/reports - Get attendance reports
router.get('/reports', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { reportType: 'department', period: 'monthly', data: [] } });
}));

module.exports = router;
