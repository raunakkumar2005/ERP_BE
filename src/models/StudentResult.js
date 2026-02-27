const mongoose = require('mongoose');
const { RESULT_STATUS } = require('../config/constants');

const studentResultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: String,
  courseCode: String,
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 0
  },
  obtainedMarks: {
    type: Number,
    required: true,
    min: 0
  },
  grade: {
    type: String,
    maxlength: 5
  },
  gradePoint: {
    type: Number,
    min: 0,
    max: 10
  },
  status: {
    type: String,
    enum: Object.values(RESULT_STATUS),
    default: RESULT_STATUS.PENDING
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  evaluatedDate: {
    type: Date
  },
  remarks: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes
studentResultSchema.index({ studentId: 1, academicYear: 1, semester: 1 });
studentResultSchema.index({ courseId: 1 });
studentResultSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
studentResultSchema.index({ semester: 1 });

module.exports = mongoose.model('StudentResult', studentResultSchema);
