const mongoose = require('mongoose');
const { PRIORITY_LEVELS } = require('../config/constants');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: 3,
    maxlength: 200,
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: 10,
    maxlength: 5000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetRoles: [{
    type: String,
    enum: ['admin', 'hod', 'faculty', 'student']
  }],
  priority: {
    type: String,
    enum: Object.values(PRIORITY_LEVELS),
    default: PRIORITY_LEVELS.MEDIUM
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes
noticeSchema.index({ createdBy: 1 });
noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ priority: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
