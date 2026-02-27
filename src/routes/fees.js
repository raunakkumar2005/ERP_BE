const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, feeSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');

// GET /fees/student/:studentId - Get student fee records
router.get('/student/:studentId', authenticate, asyncHandler(async (req, res) => {
  const structures = await FeeStructure.find({});
  const payments = await FeePayment.find({ studentId: req.params.studentId });
  const totalDue = structures.reduce((sum, s) => sum + s.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.paidAmount, 0);
  res.json({ success: true, data: { structures, payments, totalDue, totalPaid, balance: totalDue - totalPaid } });
}));

// POST /fees/payment - Process fee payment
router.post('/payment', authenticate, validate(feeSchemas.payment), asyncHandler(async (req, res) => {
  const payment = await FeePayment.create({ ...req.body, studentId: req.user._id, status: 'pending' });
  res.status(201).json({ success: true, data: { payment, receiptUrl: '' } });
}));

// GET /fees/reports - Get fee reports
router.get('/reports', authenticate, authorize('admin', 'hod'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { totalCollected: 0, totalDue: 0, collectionRate: 0, byDepartment: [], bySemester: [] } });
}));

// POST /fees/generate-invoice - Generate invoice
router.post('/generate-invoice', authenticate, authorize('admin'), validate(feeSchemas.generateInvoice), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { invoiceId: 'INV-001', invoiceUrl: '' } });
}));

module.exports = router;
