const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');

const feePaymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feeStructureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHODS),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  receiptUrl: {
    type: String
  },
  semester: {
    type: String,
    required: true
  },
  academicYear: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
feePaymentSchema.index({ studentId: 1 });
feePaymentSchema.index({ feeStructureId: 1 });
feePaymentSchema.index({ status: 1 });
feePaymentSchema.index({ transactionId: 1 }, { unique: true });

module.exports = mongoose.model('FeePayment', feePaymentSchema);
