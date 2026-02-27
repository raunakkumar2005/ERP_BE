const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, noticeSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const Notice = require('../models/Notice');

// GET /notices - Get notices for current user
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { priority, page = 1, limit = 20 } = req.query;
  const query = { targetRoles: req.user.role };
  if (priority) query.priority = priority;
  
  const notices = await Notice.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
    
  const total = await Notice.countDocuments(query);
  const unreadCount = await Notice.countDocuments({ ...query, isRead: false });
  
  res.json({ success: true, data: { notices, total, unreadCount } });
}));

// POST /notices - Create notice
router.post('/', authenticate, authorize('admin', 'hod', 'faculty'), validate(noticeSchemas.create), asyncHandler(async (req, res) => {
  const notice = await Notice.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: notice });
}));

// PUT /notices/:id - Update notice
router.put('/:id', authenticate, validate(noticeSchemas.update), asyncHandler(async (req, res) => {
  const notice = await Notice.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    req.body,
    { new: true }
  );
  if (!notice) throw new NotFoundError('Notice not found');
  res.json({ success: true, data: notice });
}));

// DELETE /notices/:id - Delete notice
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const notice = await Notice.findOneAndDelete({
    _id: req.params.id,
    $or: [{ createdBy: req.user._id }, { role: 'admin' }]
  });
  if (!notice) throw new NotFoundError('Notice not found');
  res.json({ success: true, data: { message: 'Notice deleted successfully' } });
}));

// POST /notices/:id/read - Mark notice as read
router.post('/:id/read', authenticate, asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { readBy: { user: req.user._id } }, isRead: true },
    { new: true }
  );
  if (!notice) throw new NotFoundError('Notice not found');
  res.json({ success: true, data: { message: 'Notice marked as read' } });
}));

// GET /notices/analytics - Get notice analytics
router.get('/analytics', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const totalNotices = await Notice.countDocuments();
  const readCount = await Notice.countDocuments({ isRead: true });
  const readRate = totalNotices > 0 ? (readCount / totalNotices) * 100 : 0;
  
  res.json({
    success: true,
    data: { totalNotices, readRate, byPriority: {}, recentActivity: [] }
  });
}));

module.exports = router;
