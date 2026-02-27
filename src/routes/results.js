const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, resultsSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const StudentResult = require('../models/StudentResult');

router.get('/student/:studentId', authenticate, asyncHandler(async (req, res) => {
  const { academicYear, semester, courseId } = req.query;
  const query = { studentId: req.params.studentId };
  if (academicYear) query.academicYear = academicYear;
  if (semester) query.semester = parseInt(semester);
  if (courseId) query.courseId = courseId;
  const results = await StudentResult.find(query).populate('courseId', 'name code');
  res.json({ success: true, data: { results, overall: { sgpa: 0, cgpa: 0, totalCredits: 0, earnedCredits: 0 } } });
}));

router.post('/submit', authenticate, authorize('faculty'), validate(resultsSchemas.submit), asyncHandler(async (req, res) => {
  const results = await StudentResult.insertMany(req.body.results.map(r => ({ ...r, evaluatedBy: req.user._id, evaluatedDate: new Date() })));
  res.json({ success: true, data: { message: 'Results submitted successfully', submittedCount: results.length } });
}));

router.put('/:id', authenticate, authorize('faculty'), validate(resultsSchemas.update), asyncHandler(async (req, res) => {
  const result = await StudentResult.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!result) throw new NotFoundError('Result not found');
  res.json({ success: true, data: result });
}));

router.get('/overall/:studentId', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { studentId: req.params.studentId, cgpa: 0, totalCredits: 0, earnedCredits: 0, semesterWise: [] } });
}));

router.post('/generate-transcript', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { transcriptUrl: '', transcript: {} } });
}));

router.get('/class-performance/:courseId', authenticate, authorize('faculty', 'admin', 'hod'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { courseId: req.params.courseId, avgMarks: 0, passRate: 0, gradeDistribution: {}, topPerformers: [] } });
}));

router.get('/department-analytics', authenticate, authorize('hod', 'admin'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { avgCGPA: 0, passRate: 0, byCourse: [], bySemester: [] } });
}));

router.get('/nep-assessment/:studentId', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { multidisciplinaryCredits: 0, skillBasedCredits: 0, holisticProgress: {}, competencies: [] } });
}));

router.post('/calculate-cgpa', authenticate, validate(resultsSchemas.calculateCGPA), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { cgpa: 0, sgpa: 0, totalCredits: 0 } });
}));

module.exports = router;
