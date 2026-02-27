const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, timetableSchemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const Timetable = require('../models/Timetable');
const ocrService = require('../services/ocrService');
const googleCalendarService = require('../services/googleCalendarService');
const { uploadSingle } = require('../utils/fileUpload');

// GET /timetable/student/:studentId - Get student's personal timetable
router.get('/student/:studentId', authenticate, asyncHandler(async (req, res) => {
  const timetable = await Timetable.findOne({ departmentId: req.user.department })
    .populate('schedule.facultyId', 'name');
  res.json({ success: true, data: timetable || {} });
}));

// GET /timetable/faculty/:facultyId - Get faculty's teaching timetable
router.get('/faculty/:facultyId', authenticate, asyncHandler(async (req, res) => {
  const timetable = await Timetable.find({ 'schedule.facultyId': req.params.facultyId })
    .populate('departmentId', 'name code');
  res.json({ success: true, data: timetable[0] || {} });
}));

// GET /timetable/department/:departmentId - Get department timetable
router.get('/department/:departmentId', authenticate, asyncHandler(async (req, res) => {
  const { semester, academicYear } = req.query;
  const query = { departmentId: req.params.departmentId };
  if (semester) query.semester = parseInt(semester);
  if (academicYear) query.academicYear = academicYear;
  const timetable = await Timetable.findOne(query)
    .populate('schedule.facultyId', 'name')
    .populate('createdBy', 'name');
  res.json({ success: true, data: timetable || {} });
}));

// POST /timetable - Create/Update timetable (HoD only)
router.post('/', authenticate, authorize('hod'), validate(timetableSchemas.create), asyncHandler(async (req, res) => {
  const { departmentId, semester, academicYear } = req.body;
  
  // Check if timetable already exists
  let timetable = await Timetable.findOne({ departmentId, semester, academicYear });
  
  if (timetable) {
    timetable = await Timetable.findByIdAndUpdate(
      timetable._id,
      { $set: { ...req.body, status: 'draft' } },
      { new: true }
    );
  } else {
    timetable = await Timetable.create({ ...req.body, createdBy: req.user._id });
  }
  
  res.status(201).json({ success: true, data: timetable });
}));

// POST /timetable/ocr-upload - Upload timetable image for OCR processing
router.post('/ocr-upload', authenticate, authorize('hod'), asyncHandler(async (req, res) => {
  uploadSingle('image')(req, res, async (err) => {
    if (err) {
      throw new Error(`File upload error: ${err.message}`);
    }

    if (!req.file) {
      throw new Error('No image file uploaded');
    }

    const { departmentId, semester } = req.body;
    
    if (!departmentId || !semester) {
      throw new Error('departmentId and semester are required');
    }

    // Process image with OCR
    const imagePath = req.file.path;
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(imagePath);
    
    try {
      const result = await ocrService.processTimetable(imageBuffer, {
        departmentId,
        semester: parseInt(semester)
      });

      // Create timetable with OCR results
      const timetable = await Timetable.findOneAndUpdate(
        { departmentId, semester: parseInt(semester), academicYear: new Date().getFullYear().toString() },
        {
          departmentId,
          semester: parseInt(semester),
          academicYear: new Date().getFullYear().toString(),
          schedule: result.slots,
          ocrProcessed: true,
          status: 'draft',
          createdBy: req.user._id
        },
        { new: true, upsert: true }
      );

      res.json({
        success: true,
        data: {
          jobId: result.jobId,
          status: 'completed',
          timetable: timetable,
          message: 'OCR processing completed',
          extractedSlots: result.slots.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'OCR_001', message: error.message }
      });
    }
  });
}));

// GET /timetable/ocr-status/:jobId - Check OCR processing status
router.get('/ocr-status/:jobId', authenticate, asyncHandler(async (req, res) => {
  const jobStatus = ocrService.getJobStatus(req.params.jobId);
  
  res.json({
    success: true,
    data: {
      jobId: req.params.jobId,
      status: jobStatus.status,
      progress: jobStatus.progress || null,
      error: jobStatus.error || null
    }
  });
}));

// POST /timetable/google-calendar-sync - Sync timetable with Google Calendar
router.post('/google-calendar-sync', authenticate, asyncHandler(async (req, res) => {
  const { timetableId, calendarId, syncType } = req.body;
  
  // Get timetable
  const timetable = await Timetable.findById(timetableId);
  if (!timetable) {
    throw new NotFoundError('Timetable not found');
  }

  try {
    // Sync to Google Calendar
    const eventIds = await googleCalendarService.syncTimetableToCalendar(
      timetable.toObject(),
      calendarId || 'primary'
    );

    // Update timetable with sync status
    timetable.googleCalendarSynced = true;
    await timetable.save();

    res.json({
      success: true,
      data: {
        message: 'Timetable synced with Google Calendar',
        eventIds: eventIds,
        syncedSlots: eventIds.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CALENDAR_001', message: error.message }
    });
  }
}));

// GET /timetable/google-auth-url - Get Google OAuth URL
router.get('/google-auth-url', authenticate, asyncHandler(async (req, res) => {
  try {
    const authUrl = googleCalendarService.getAuthUrl();
    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CALENDAR_002', message: error.message }
    });
  }
}));

// GET /timetable/google-callback - Handle Google OAuth callback
router.get('/google-callback', asyncHandler(async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    await googleCalendarService.handleCallback(code);
    res.redirect('/?success=calendar_connected');
  } catch (error) {
    res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
  }
}));

module.exports = router;
