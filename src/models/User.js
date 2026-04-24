const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minlength: 2,
    maxlength: 100,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.STUDENT,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  employeeId: {
    type: String,
    sparse: true,
    index: true,
    trim: true
  },
  studentId: {
    type: String,
    sparse: true,
    index: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  // Faculty-specific fields
  qualifications: [{
    type: String
  }],
  specializations: [{
    type: String
  }],
  experience: {
    type: String
  },
  // Student-specific fields
  semester: {
    type: String
  },
  section: {
    type: String
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10
  },
  skills: [{
    type: String
  }],
  projects: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  refreshToken: {
    type: String,
    select: false
  },
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for common queries
// Note: email has unique: true which auto-creates index
// Note: employeeId and studentId have index: true in schema
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1, department: 1 });

// Virtual for public profile (excludes sensitive fields)
userSchema.virtual('publicProfile').get(function () {
  return {
    id: this._id,
    name: this.name,
    avatar: this.avatar,
    role: this.role,
    department: this.department,
    bio: this.bio,
    qualifications: this.qualifications,
    specializations: this.specializations,
    experience: this.experience,
    skills: this.skills,
    projects: this.projects
  };
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Soft delete method
userSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
