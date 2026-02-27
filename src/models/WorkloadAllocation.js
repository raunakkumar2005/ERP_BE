const mongoose = require('mongoose');
const { TIMETABLE_STATUS } = require('../config/constants');

const courseLoadSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: String,
  hoursPerWeek: {
    type: Number,
    min: 0
  },
  studentCount: {
    type: Number,
    default: 0
  },
  courseType: {
    type: String,
    enum: ['theory', 'practical', 'tutorial'],
    default: 'theory'
  }
});

const workloadAllocationSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  facultyName: String,
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
  courses: [courseLoadSchema],
  totalHours: {
    type: Number,
    default: 0
  },
  maxHours: {
    type: Number,
    default: 20
  },
  additionalDuties: [{
    type: String
  }],
  status: {
    type: String,
    enum: Object.values(TIMETABLE_STATUS),
    default: TIMETABLE_STATUS.DRAFT
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
workloadAllocationSchema.index({ facultyId: 1, academicYear: 1, semester: 1 });
workloadAllocationSchema.index({ status: 1 });

module.exports = mongoose.model('WorkloadAllocation', workloadAllocationSchema);
