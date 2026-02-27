const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    minlength: 2,
    maxlength: 100,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 10
  },
  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hodName: {
    type: String
  },
  facultyCount: {
    type: Number,
    default: 0
  },
  studentCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ name: 1 });

module.exports = mongoose.model('Department', departmentSchema);
