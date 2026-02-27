const mongoose = require('mongoose');
const { TIMETABLE_STATUS, DAYS_OF_WEEK, TIMETABLE_SLOT_TYPES } = require('../config/constants');

const timetableSlotSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  courseName: String,
  courseCode: String,
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  facultyName: String,
  day: {
    type: String,
    enum: DAYS_OF_WEEK,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  room: String,
  type: {
    type: String,
    enum: Object.values(TIMETABLE_SLOT_TYPES),
    default: TIMETABLE_SLOT_TYPES.LECTURE
  }
});

const timetableSchema = new mongoose.Schema({
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  academicYear: {
    type: String,
    required: true
  },
  schedule: [timetableSlotSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: Object.values(TIMETABLE_STATUS),
    default: TIMETABLE_STATUS.DRAFT
  },
  ocrProcessed: {
    type: Boolean,
    default: false
  },
  googleCalendarSynced: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
timetableSchema.index({ departmentId: 1, semester: 1, academicYear: 1 }, { unique: true });
timetableSchema.index({ status: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
