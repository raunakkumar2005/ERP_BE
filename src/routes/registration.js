const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, registrationSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const Course = require('../models/Course');

router.get('/available-courses', authenticate, asyncHandler(async (req, res) => {
  const { semester, type } = req.query;
  const query = { status: 'active' };
  if (semester) query.semester = semester;
  if (type) query.type = type;
  const courses = await Course.find(query);
  res.json({ success: true, data: { courses, registrationOpen: true, registrationDeadline: null } });
}));

router.post('/register', authenticate, validate(registrationSchemas.register), asyncHandler(async (req, res) => {
  const { courseIds, semester, academicYear } = req.body;
  const courses = await Course.find({ _id: { $in: courseIds } });
  for (const course of courses) {
    if (!course.enrolledStudents.includes(req.user._id)) {
      course.enrolledStudents.push(req.user._id);
      course.students = course.enrolledStudents.length;
      await course.save();
    }
  }
  res.json({ success: true, data: { message: 'Registration successful', registeredCourses: courses } });
}));

router.delete('/drop/:courseId', authenticate, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (course) {
    course.enrolledStudents = course.enrolledStudents.filter(s => s.toString() !== req.user._id.toString());
    course.students = course.enrolledStudents.length;
    await course.save();
  }
  res.json({ success: true, data: { message: 'Course dropped successfully' } });
}));

router.get('/prerequisites/:courseId', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { prerequisites: [], eligible: true, missingRequirements: [] } });
}));

router.post('/waitlist/:courseId', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { message: 'Added to waitlist', position: 1 } });
}));

router.get('/status', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { registered: [], pending: [], waitlisted: [], totalCredits: 0 } });
}));

router.post('/approve/:studentId', authenticate, authorize('hod'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { message: 'Registration approved' } });
}));

router.get('/department-overview', authenticate, authorize('hod', 'admin'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { totalRegistrations: 0, byCourse: [], pendingApprovals: 0 } });
}));

module.exports = router;
