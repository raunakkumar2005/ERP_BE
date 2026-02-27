const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, approvalSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const ApprovalRequest = require('../models/ApprovalRequest');

router.get('/pending', authenticate, asyncHandler(async (req, res) => {
  const requests = await ApprovalRequest.find({ currentApprover: req.user._id, status: 'pending' }).sort({ createdAt: -1 });
  res.json({ success: true, data: requests });
}));

router.get('/history', authenticate, asyncHandler(async (req, res) => {
  const requests = await ApprovalRequest.find({ requesterId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: requests });
}));

router.post('/request', authenticate, validate(approvalSchemas.create), asyncHandler(async (req, res) => {
  const request = await ApprovalRequest.create({ ...req.body, requesterId: req.user._id, requesterName: req.user.name, currentApprover: req.user._id });
  res.status(201).json({ success: true, data: request });
}));

router.post('/:id/action', authenticate, validate(approvalSchemas.action), asyncHandler(async (req, res) => {
  const { action, comments } = req.body;
  const request = await ApprovalRequest.findById(req.params.id);
  if (!request) throw new NotFoundError('Approval request not found');
  request.approvalHistory.push({ userId: req.user._id, userName: req.user.name, action, comments });
  request.status = action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'pending';
  await request.save();
  res.json({ success: true, data: request });
}));

router.put('/:id/escalate', authenticate, validate(approvalSchemas.escalate), asyncHandler(async (req, res) => {
  const request = await ApprovalRequest.findByIdAndUpdate(req.params.id, { currentApprover: req.body.escalateTo, status: 'escalated' }, { new: true });
  if (!request) throw new NotFoundError('Approval request not found');
  res.json({ success: true, data: request });
}));

router.get('/analytics', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { pending: 0, approved: 0, rejected: 0, avgProcessingTime: 0 } });
}));

module.exports = router;
