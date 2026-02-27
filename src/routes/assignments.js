const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, assignmentSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');

// GET /assignments/student - Get student assignments
router.get('/student', authenticate, asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ status: 'active' }).populate('courseId', 'name code');
  res.json({ success: true, data: assignments });
}));

// GET /assignments/faculty - Get faculty assignments
router.get('/faculty', authenticate, authorize('faculty'), asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ facultyId: req.user._id }).populate('courseId', 'name code');
  res.json({ success: true, data: assignments });
}));

// POST /assignments - Create assignment
router.post('/', authenticate, authorize('faculty'), validate(assignmentSchemas.create), asyncHandler(async (req, res) => {
  const assignment = await Assignment.create({ ...req.body, facultyId: req.user._id });
  res.status(201).json({ success: true, data: assignment });
}));

// PUT /assignments/:id - Update assignment
router.put('/:id', authenticate, authorize('faculty'), validate(assignmentSchemas.update), asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOneAndUpdate(
    { _id: req.params.id, facultyId: req.user._id },
    req.body,
    { new: true }
  );
  if (!assignment) throw new NotFoundError('Assignment not found');
  res.json({ success: true, data: assignment });
}));

// DELETE /assignments/:id - Delete assignment
router.delete('/:id', authenticate, authorize('faculty'), asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, facultyId: req.user._id });
  if (!assignment) throw new NotFoundError('Assignment not found');
  res.json({ success: true, data: { message: 'Assignment deleted successfully' } });
}));

// POST /assignments/:id/submit - Submit assignment
router.post('/:id/submit', authenticate, validate(assignmentSchemas.submit), asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new NotFoundError('Assignment not found');
  
  const submission = await AssignmentSubmission.findOneAndUpdate(
    { assignmentId: req.params.id, studentId: req.user._id },
    { ...req.body, studentId: req.user._id, studentName: req.user.name },
    { new: true, upsert: true }
  );
  
  assignment.submittedCount += 1;
  await assignment.save();
  
  res.json({ success: true, data: submission });
}));

// PUT /assignments/submissions/:id/grade - Grade submission
router.put('/submissions/:id/grade', authenticate, authorize('faculty'), validate(assignmentSchemas.grade), asyncHandler(async (req, res) => {
  const submission = await AssignmentSubmission.findByIdAndUpdate(
    req.params.id,
    { ...req.body, status: 'graded' },
    { new: true }
  );
  if (!submission) throw new NotFoundError('Submission not found');
  res.json({ success: true, data: submission });
}));

// GET /assignments/:id/submissions - Get submissions
router.get('/:id/submissions', authenticate, authorize('faculty'), asyncHandler(async (req, res) => {
  const submissions = await AssignmentSubmission.find({ assignmentId: req.params.id })
    .populate('studentId', 'name email studentId');
  res.json({ success: true, data: submissions });
}));

module.exports = router;
