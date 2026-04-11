const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, departmentSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const Department = require('../models/Department');
const User = require('../models/User');


// GET /departments - Get all departments
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true });
  res.json({ success: true, data: departments });
}));

// POST /departments - Create department (Admin only)
router.post('/', authenticate, authorize('admin'), validate(departmentSchemas.create), asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  res.status(201).json({ success: true, data: department });
}));

// PUT /departments/:id - Update department (Admin/HoD only)
router.put('/:id', authenticate, authorize('admin', 'hod'), validate(departmentSchemas.update), asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!department) throw new NotFoundError('Department not found');
  res.json({ success: true, data: department });
}));

// DELETE /departments/:id - Delete department (Admin only)
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!department) throw new NotFoundError('Department not found');
  res.json({ success: true, data: { message: 'Department deleted successfully' } });
}));

// GET /departments/:id/statistics - Get department statistics
router.get('/:id/statistics', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const facultyCount = await User.countDocuments({ department: req.params.id, role: { $in: ['faculty', 'hod'] }, isActive: true });
  const studentCount = await User.countDocuments({ department: req.params.id, role: 'student', isActive: true });
  const Course = require('../models/Course');
  const courseCount = await Course.countDocuments({ department: req.params.id });
  
  res.json({
    success: true,
    data: { facultyCount, studentCount, courseCount, avgAttendance: 0, avgGPA: 0 }
  });
}));

module.exports = router;
