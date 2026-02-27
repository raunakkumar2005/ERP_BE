const mongoose = require('mongoose');
const { SUBMISSION_STATUS } = require('../config/constants');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  fileUrl: {
    type: String,
    required: true
  },
  marks: {
    type: Number,
    min: 0
  },
  feedback: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: Object.values(SUBMISSION_STATUS),
    default: SUBMISSION_STATUS.SUBMITTED
  }
}, {
  timestamps: true
});

// Indexes
assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
assignmentSubmissionSchema.index({ studentId: 1 });
assignmentSubmissionSchema.index({ assignmentId: 1 });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
