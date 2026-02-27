const mongoose = require('mongoose');
const { COURSE_TYPES, COURSE_STATUS } = require('../config/constants');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    minlength: 2,
    maxlength: 200,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 20
  },
  semester: {
    type: String,
    required: [true, 'Semester is required']
  },
  students: {
    type: Number,
    default: 0,
    min: 0
  },
  schedule: {
    type: String
  },
  room: {
    type: String
  },
  status: {
    type: String,
    enum: Object.values(COURSE_STATUS),
    default: COURSE_STATUS.ACTIVE
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  facultyName: {
    type: String
  },
  description: {
    type: String,
    maxlength: 1000
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: 1,
    max: 10
  },
  type: {
    type: String,
    enum: Object.values(COURSE_TYPES),
    default: COURSE_TYPES.CORE,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  maxCapacity: {
    type: Number,
    default: 60
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  waitlist: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    position: Number,
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes
courseSchema.index({ code: 1 }, { unique: true });
courseSchema.index({ department: 1 });
courseSchema.index({ semester: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ type: 1 });
courseSchema.index({ faculty: 1 });
courseSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('Course', courseSchema);
