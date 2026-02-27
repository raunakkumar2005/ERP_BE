const mongoose = require('mongoose');
const { FEE_TYPES } = require('../config/constants');

const feeStructureSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(FEE_TYPES),
    required: true
  },
  name: {
    type: String,
    required: [true, 'Fee name is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date
  },
  semester: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
feeStructureSchema.index({ semester: 1, academicYear: 1 });
feeStructureSchema.index({ type: 1 });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
