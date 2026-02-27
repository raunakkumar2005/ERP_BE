const mongoose = require('mongoose');
const { MENTORSHIP_STATUS, SESSION_TYPES } = require('../config/constants');

const mentorshipSessionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    enum: Object.values(SESSION_TYPES),
    required: true
  },
  topics: [{
    type: String
  }],
  outcomes: {
    type: String,
    maxlength: 2000
  },
  nextSteps: {
    type: String,
    maxlength: 1000
  },
  studentFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    comments: { type: String, maxlength: 500 }
  }
});

const mentorshipRecordSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentorName: {
    type: String
  },
  menteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  menteeName: {
    type: String
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: Object.values(MENTORSHIP_STATUS),
    default: MENTORSHIP_STATUS.ACTIVE
  },
  meetingSchedule: {
    type: String
  },
  sessions: [mentorshipSessionSchema],
  goals: [{
    type: String
  }],
  notes: {
    type: String,
    maxlength: 2000
  }
}, {
  timestamps: true
});

// Indexes
mentorshipRecordSchema.index({ mentorId: 1 });
mentorshipRecordSchema.index({ menteeId: 1 });
mentorshipRecordSchema.index({ status: 1 });

module.exports = mongoose.model('MentorshipRecord', mentorshipRecordSchema);
