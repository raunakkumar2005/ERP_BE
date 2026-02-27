const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, grievanceSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const Grievance = require('../models/Grievance');

// GET /grievances/student - Get student grievances
router.get('/student', authenticate, asyncHandler(async (req, res) => {
  const grievances = await Grievance.find({ studentId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: grievances });
}));

// GET /grievances/assigned - Get assigned grievances
router.get('/assigned', authenticate, authorize('faculty', 'admin', 'hod'), asyncHandler(async (req, res) => {
  const grievances = await Grievance.find({ assignedTo: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: grievances });
}));

// POST /grievances - Submit grievance
router.post('/', authenticate, validate(grievanceSchemas.create), asyncHandler(async (req, res) => {
  const grievance = await Grievance.create({ ...req.body, studentId: req.user._id });
  res.status(201).json({ success: true, data: grievance });
}));

// PUT /grievances/:id/status - Update status
router.put('/:id/status', authenticate, authorize('admin', 'hod', 'faculty'), validate(grievanceSchemas.updateStatus), asyncHandler(async (req, res) => {
  const { status, resolution } = req.body;
  const update = { status };
  if (resolution) update.resolution = resolution;
  if (status === 'resolved') update.resolvedAt = new Date();
  const grievance = await Grievance.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!grievance) throw new NotFoundError('Grievance not found');
  res.json({ success: true, data: grievance });
}));

// POST /grievances/:id/assign - Assign grievance
router.post('/:id/assign', authenticate, authorize('admin', 'hod'), validate(grievanceSchemas.assign), asyncHandler(async (req, res) => {
  const grievance = await Grievance.findByIdAndUpdate(req.params.id, { assignedTo: req.body.assignedTo }, { new: true });
  if (!grievance) throw new NotFoundError('Grievance not found');
  res.json({ success: true, data: grievance });
}));

module.exports = router;
