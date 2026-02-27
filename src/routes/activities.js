const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, activitySchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const ExtracurricularActivity = require('../models/ExtracurricularActivity');

router.get('/student/:studentId', authenticate, asyncHandler(async (req, res) => {
  const { type, academicYear, verified } = req.query;
  const query = { studentId: req.params.studentId };
  if (type) query.activityType = type;
  if (academicYear) query.academicYear = academicYear;
  if (verified !== undefined) query.verificationStatus = verified ? 'verified' : 'pending';
  const activities = await ExtracurricularActivity.find(query).sort({ startDate: -1 });
  const totalNEPPoints = activities.reduce((sum, a) => sum + (a.nepPoints || 0), 0);
  res.json({ success: true, data: { activities, totalNEPPoints, byType: {} } });
}));

router.post('/', authenticate, validate(activitySchemas.create), asyncHandler(async (req, res) => {
  const activity = await ExtracurricularActivity.create({ ...req.body, studentId: req.user._id });
  res.status(201).json({ success: true, data: activity });
}));

router.put('/:id', authenticate, validate(activitySchemas.update), asyncHandler(async (req, res) => {
  const activity = await ExtracurricularActivity.findOneAndUpdate({ _id: req.params.id, studentId: req.user._id }, req.body, { new: true });
  if (!activity) throw new NotFoundError('Activity not found');
  res.json({ success: true, data: activity });
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const activity = await ExtracurricularActivity.findOneAndDelete({ _id: req.params.id, studentId: req.user._id });
  if (!activity) throw new NotFoundError('Activity not found');
  res.json({ success: true, data: { message: 'Activity deleted successfully' } });
}));

router.post('/:id/verify', authenticate, authorize('faculty'), validate(activitySchemas.verify), asyncHandler(async (req, res) => {
  const activity = await ExtracurricularActivity.findByIdAndUpdate(req.params.id, { ...req.body, verifiedBy: req.user._id }, { new: true });
  if (!activity) throw new NotFoundError('Activity not found');
  res.json({ success: true, data: activity });
}));

router.get('/verification-pending', authenticate, authorize('faculty'), asyncHandler(async (req, res) => {
  const activities = await ExtracurricularActivity.find({ verificationStatus: 'pending' });
  res.json({ success: true, data: activities });
}));

router.get('/analytics/:studentId', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { totalActivities: 0, totalHours: 0, totalNEPPoints: 0, byType: {}, byParticipationType: {} } });
}));

module.exports = router;
