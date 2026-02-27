const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, courseSchemas, commonSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const Course = require('../models/Course');

// GET /courses - Get courses (filtered by user role/department)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { department, semester, type, page = 1, limit = 20 } = req.query;
  const query = {};
  if (department) query.department = department;
  if (semester) query.semester = semester;
  if (type) query.type = type;
  
  const courses = await Course.find(query)
    .populate('department', 'name code')
    .populate('faculty', 'name email')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
    
  const total = await Course.countDocuments(query);
  
  res.json({
    success: true,
    data: { courses, total, page: parseInt(page), limit: parseInt(limit) }
  });
}));

// POST /courses - Create course (Admin/HoD only)
router.post('/', authenticate, authorize('admin', 'hod'), validate(courseSchemas.create), asyncHandler(async (req, res) => {
  const course = await Course.create(req.body);
  res.status(201).json({ success: true, data: course });
}));

// PUT /courses/:id - Update course
router.put('/:id', authenticate, authorize('admin', 'hod', 'faculty'), validate(courseSchemas.update), asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!course) throw new NotFoundError('Course not found');
  res.json({ success: true, data: course });
}));

// DELETE /courses/:id - Delete course (Admin/HoD only)
router.delete('/:id', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) throw new NotFoundError('Course not found');
  res.json({ success: true, data: { message: 'Course deleted successfully' } });
}));

// GET /courses/:id/enrollment - Get course enrollment details
router.get('/:id/enrollment', authenticate, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('enrolledStudents', 'name email studentId');
  if (!course) throw new NotFoundError('Course not found');
  res.json({
    success: true,
    data: {
      courseId: course._id,
      enrolledStudents: course.enrolledStudents,
      totalEnrolled: course.enrolledStudents.length,
      maxCapacity: course.maxCapacity
    }
  });
}));

// POST /courses/:id/enroll - Enroll student in course
router.post('/:id/enroll', authenticate, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new NotFoundError('Course not found');
  if (!course.enrolledStudents.includes(req.user._id)) {
    course.enrolledStudents.push(req.user._id);
    course.students = course.enrolledStudents.length;
    await course.save();
  }
  res.json({ success: true, data: { message: 'Enrolled successfully' } });
}));

// DELETE /courses/:id/enroll - Drop course
router.delete('/:id/enroll', authenticate, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new NotFoundError('Course not found');
  course.enrolledStudents = course.enrolledStudents.filter(s => s.toString() !== req.user._id.toString());
  course.students = course.enrolledStudents.length;
  await course.save();
  res.json({ success: true, data: { message: 'Course dropped successfully' } });
}));

module.exports = router;
