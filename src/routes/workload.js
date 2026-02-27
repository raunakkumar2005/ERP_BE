const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, workloadSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const WorkloadAllocation = require('../models/WorkloadAllocation');

router.get('/faculty/:facultyId', authenticate, asyncHandler(async (req, res) => {
  const { academicYear, semester } = req.query;
  const query = { facultyId: req.params.facultyId };
  if (academicYear) query.academicYear = academicYear;
  if (semester) query.semester = semester;
  const allocation = await WorkloadAllocation.findOne(query);
  res.json({ success: true, data: allocation || {} });
}));

router.get('/department/:departmentId', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { allocations: [], totalHours: 0, avgWorkload: 0 } });
}));

router.post('/allocate', authenticate, authorize('admin'), validate(workloadSchemas.allocate), asyncHandler(async (req, res) => {
  const allocation = await WorkloadAllocation.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: allocation });
}));

router.put('/:id', authenticate, authorize('admin'), validate(workloadSchemas.update), asyncHandler(async (req, res) => {
  const allocation = await WorkloadAllocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!allocation) throw new NotFoundError('Workload allocation not found');
  res.json({ success: true, data: allocation });
}));

router.post('/:id/approve', authenticate, authorize('hod'), asyncHandler(async (req, res) => {
  const allocation = await WorkloadAllocation.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy: req.user._id }, { new: true });
  if (!allocation) throw new NotFoundError('Workload allocation not found');
  res.json({ success: true, data: { message: 'Workload approved successfully' } });
}));

router.get('/reports', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { report: {} } });
}));

module.exports = router;
