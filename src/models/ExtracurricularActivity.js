const mongoose = require('mongoose');
const { ACTIVITY_TYPES, PARTICIPATION_TYPES, VERIFICATION_STATUS } = require('../config/constants');

const extracurricularActivitySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityType: {
    type: String,
    enum: Object.values(ACTIVITY_TYPES),
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: 3,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 2000
  },
  organizingBody: {
    type: String,
    maxlength: 200
  },
  participationType: {
    type: String,
    enum: Object.values(PARTICIPATION_TYPES),
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  hoursInvolved: {
    type: Number,
    min: 0
  },
  certificateUrl: {
    type: String
  },
  skillsGained: [{
    type: String
  }],
  nepPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  verificationStatus: {
    type: String,
    enum: Object.values(VERIFICATION_STATUS),
    default: VERIFICATION_STATUS.PENDING
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  academicYear: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
extracurricularActivitySchema.index({ studentId: 1 });
extracurricularActivitySchema.index({ activityType: 1 });
extracurricularActivitySchema.index({ verificationStatus: 1 });
extracurricularActivitySchema.index({ nepPoints: -1 });

module.exports = mongoose.model('ExtracurricularActivity', extracurricularActivitySchema);
