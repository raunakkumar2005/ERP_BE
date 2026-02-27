const mongoose = require('mongoose');
const { ASSIGNMENT_STATUS } = require('../config/constants');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: 3,
    maxlength: 200,
    trim: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: {
    type: String
  },
  description: {
    type: String,
    maxlength: 2000
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 0
  },
  submittedCount: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(ASSIGNMENT_STATUS),
    default: ASSIGNMENT_STATUS.ACTIVE
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
    type: String
  }],
  instructions: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Indexes
assignmentSchema.index({ courseId: 1 });
assignmentSchema.index({ facultyId: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ courseId: 1, status: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
