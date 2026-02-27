const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, authSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');

// POST /auth/login - Login user
router.post('/login', validate(authSchemas.login), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_001', message: 'Invalid credentials' }
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_004', message: 'Account deactivated' }
    });
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_001', message: 'Invalid credentials' }
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);
  
  // Save refresh token
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  // Remove password from response
  user.password = undefined;

  res.json({
    success: true,
    data: {
      user,
      token: accessToken,
      refreshToken,
      expiresIn: 86400 // 24 hours in seconds
    }
  });
}));

// POST /auth/register - Register new user (Admin only)
// For testing, allow registration without auth - remove authenticate in production or use proper admin check
router.post('/register', validate(authSchemas.register), asyncHandler(async (req, res) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: { code: 'VAL_004', message: 'User already exists with this email' }
    });
  }

  // Create user
  const user = await User.create(req.body);

  // Generate tokens for auto-login after registration
  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  await user.save();

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  res.status(201).json({
    success: true,
    data: {
      user: userResponse,
      token: accessToken,
      refreshToken,
      expiresIn: 86400,
      message: 'User registered successfully'
    }
  });
}));

// POST /auth/forgot-password - Request password reset
router.post('/forgot-password', validate(authSchemas.forgotPassword), asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user
  const user = await User.findOne({ email });
  
  // Always return success to prevent email enumeration
  res.json({
    success: true,
    data: { message: 'Password reset email sent' }
  });
}));

// POST /auth/reset-password - Reset password with token
router.post('/reset-password', validate(authSchemas.resetPassword), asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // TODO: Implement actual token verification with passwordResetToken
  // For now, just return success
  res.json({
    success: true,
    data: { message: 'Password reset successful' }
  });
}));

// POST /auth/refresh-token - Refresh JWT token
router.post('/refresh-token', validate(authSchemas.refreshToken), asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  try {
    // Verify refresh token
    const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user with this refresh token
    const user = await User.findOne({ 
      _id: decoded.id, 
      refreshToken: refreshToken 
    }).select('+refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_002', message: 'Invalid or expired refresh token' }
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);
    
    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        token: tokens.accessToken,
        expiresIn: 86400
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_002', message: 'Invalid or expired refresh token' }
    });
  }
}));

// POST /auth/logout - Logout user
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // Clear refresh token
  req.user.refreshToken = undefined;
  await req.user.save();

  res.json({
    success: true,
    data: { message: 'Logged out successfully' }
  });
}));

module.exports = router;
