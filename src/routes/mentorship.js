const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, mentorshipSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const MentorshipRecord = require('../models/MentorshipRecord');

router.get('/mentor/:facultyId', authenticate, asyncHandler(async (req, res) => {
  const records = await MentorshipRecord.find({ mentorId: req.params.facultyId }).populate('menteeId', 'name email');
  res.json({ success: true, data: records });
}));

router.get('/mentee/:studentId', authenticate, asyncHandler(async (req, res) => {
  const record = await MentorshipRecord.findOne({ menteeId: req.params.studentId, status: 'active' }).populate('mentorId', 'name email');
  res.json({ success: true, data: record || {} });
}));

router.post('/assign', authenticate, authorize('admin', 'hod'), validate(mentorshipSchemas.assign), asyncHandler(async (req, res) => {
  const { mentorId, menteeId, goals, meetingSchedule } = req.body;
  const User = require('../models/User');
  const mentor = await User.findById(mentorId);
  const mentee = await User.findById(menteeId);
  const record = await MentorshipRecord.create({
    mentorId, mentorName: mentor?.name,
    menteeId, menteeName: mentee?.name,
    goals, meetingSchedule
  });
  res.status(201).json({ success: true, data: record });
}));

router.post('/:id/session', authenticate, authorize('faculty'), validate(mentorshipSchemas.session), asyncHandler(async (req, res) => {
  const record = await MentorshipRecord.findByIdAndUpdate(req.params.id, { $push: { sessions: req.body } }, { new: true });
  if (!record) throw new NotFoundError('Mentorship record not found');
  res.json({ success: true, data: record });
}));

router.put('/:id/status', authenticate, validate(mentorshipSchemas.updateStatus), asyncHandler(async (req, res) => {
  const record = await MentorshipRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!record) throw new NotFoundError('Mentorship record not found');
  res.json({ success: true, data: record });
}));

router.get('/analytics', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { totalMentorships: 0, activeMentorships: 0, avgSessionsPerMonth: 0, satisfactionRate: 0 } });
}));

module.exports = router;
