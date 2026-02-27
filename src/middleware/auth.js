const jwt = require('jsonwebtoken');
const { USER_ROLES } = require('../config/constants');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');
const User = require('../models/User');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      department: user.department
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
};

// Authentication middleware - verifies JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Fetch user to ensure they still exist and are active
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account deactivated', 'AUTH_004');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token expired', 'AUTH_002'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token', 'AUTH_001'));
    } else {
      next(error);
    }
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
};

// Department-scoped access (HoD can only access their department)
const authorizeDepartment = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('Not authenticated'));
  }

  // Admin and HoD can access all departments or their own
  if (req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.HOD) {
    const requestedDept = req.params.departmentId || req.body.department;
    
    if (requestedDept && requestedDept !== req.user.department.toString()) {
      if (req.user.role !== USER_ROLES.ADMIN) {
        return next(new AuthorizationError('Access denied to this department'));
      }
    }
  }

  next();
};

// Check if user owns resource or is admin/hod
const authorizeOwnerOrRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Not authenticated'));
    }

    const resourceOwnerId = req.params.id || req.params.userId;
    
    // Admin, HoD can access any resource
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Check if user owns the resource
    if (resourceOwnerId && resourceOwnerId === req.user._id.toString()) {
      return next();
    }

    next(new AuthorizationError('You do not have permission to access this resource'));
  };
};

module.exports = {
  generateTokens,
  verifyToken,
  authenticate,
  authorize,
  authorizeDepartment,
  authorizeOwnerOrRole
};
