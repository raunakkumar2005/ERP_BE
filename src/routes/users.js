const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, userSchemas, commonSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const User = require('../models/User');
const QRCode = require('qrcode');

// GET /users/profile - Get current user profile
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
}));

// PUT /users/profile - Update current user profile
router.put('/profile', authenticate, validate(userSchemas.updateProfile), asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: user
  });
}));

// GET /users/public-profile/:userId - Get public profile
router.get('/public-profile/:userId', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: user.publicProfile
  });
}));

// POST /users/generate-qr - Generate QR code for profile
router.post('/generate-qr', authenticate, asyncHandler(async (req, res) => {
  const profileUrl = `${process.env.BASE_URL}/users/public-profile/${req.user._id}`;
  const qrCodeUrl = await QRCode.toDataURL(profileUrl);

  res.json({
    success: true,
    data: { qrCodeUrl }
  });
}));

// GET /users/:id - Get user by ID (Admin/HoD only)
router.get('/:id', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: user
  });
}));

// PUT /users/:id - Update user (Admin/HoD only)
router.put('/:id', authenticate, authorize('admin', 'hod'), validate(userSchemas.updateUser), asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: user
  });
}));

// DELETE /users/:id - Deactivate user (Admin only)
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  await user.deactivate();

  res.json({
    success: true,
    data: { message: 'User deactivated successfully' }
  });
}));

// GET /users/department/:departmentId - Get users by department
router.get('/department/:departmentId', authenticate, asyncHandler(async (req, res) => {
  const users = await User.find({ department: req.params.departmentId, isActive: true });

  res.json({
    success: true,
    data: users
  });
}));

module.exports = router;
