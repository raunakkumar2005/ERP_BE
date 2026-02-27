const mongoose = require('mongoose');
const { GRIEVANCE_CATEGORIES, GRIEVANCE_STATUS, PRIORITY_LEVELS } = require('../config/constants');

const grievanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: Object.values(GRIEVANCE_CATEGORIES),
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    minlength: 5,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: 20,
    maxlength: 5000
  },
  priority: {
    type: String,
    enum: Object.values(PRIORITY_LEVELS),
    default: PRIORITY_LEVELS.MEDIUM
  },
  status: {
    type: String,
    enum: Object.values(GRIEVANCE_STATUS),
    default: GRIEVANCE_STATUS.SUBMITTED
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    type: String
  }],
  resolution: {
    type: String
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
grievanceSchema.index({ studentId: 1 });
grievanceSchema.index({ status: 1 });
grievanceSchema.index({ category: 1 });
grievanceSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Grievance', grievanceSchema);
