const mongoose = require('mongoose');
const { APPROVAL_TYPES, APPROVAL_STATUS, APPROVAL_ACTIONS, APPROVER_LEVELS } = require('../config/constants');

const approvalActionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  action: {
    type: String,
    enum: Object.values(APPROVAL_ACTIONS),
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  comments: {
    type: String,
    maxlength: 1000
  }
});

const approvalRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(APPROVAL_TYPES),
    required: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterName: String,
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: 3,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: 10,
    maxlength: 3000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: Object.values(APPROVAL_STATUS),
    default: APPROVAL_STATUS.PENDING
  },
  approverLevel: {
    type: String,
    enum: Object.values(APPROVER_LEVELS),
    default: APPROVER_LEVELS.HOD
  },
  currentApprover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalHistory: [approvalActionSchema],
  attachments: [{
    type: String
  }],
  deadline: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
approvalRequestSchema.index({ requesterId: 1 });
approvalRequestSchema.index({ status: 1 });
approvalRequestSchema.index({ type: 1 });
approvalRequestSchema.index({ currentApprover: 1 });

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
