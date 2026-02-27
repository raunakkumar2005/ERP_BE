const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const File = require('../models/File');
const { uploadSingle } = require('../utils/fileUpload');
const path = require('path');
const fs = require('fs');

// POST /files/upload - Upload file
router.post('/upload', authenticate, asyncHandler(async (req, res) => {
  uploadSingle('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        throw new ValidationError('File size exceeds limit of 10MB');
      }
      if (err.message === 'Invalid file type') {
        throw new ValidationError('Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX');
      }
      throw new ValidationError(err.message);
    }

    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    // Save file metadata to database
    const file = await File.create({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      type: req.body.type || 'other',
      uploadedBy: req.user._id,
      relatedEntity: req.body.relatedEntity,
      relatedEntityId: req.body.relatedEntityId
    });

    res.status(201).json({
      success: true,
      data: {
        fileId: file._id,
        fileUrl: file.fileUrl,
        fileName: file.originalName,
        fileSize: file.fileSize,
        mimeType: file.mimeType
      }
    });
  });
}));

// GET /files/:id - Get file info
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) {
    throw new NotFoundError('File not found');
  }
  res.json({ success: true, data: file });
}));

// GET /files/:id/download - Download file
router.get('/:id/download', authenticate, asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) {
    throw new NotFoundError('File not found');
  }

  const filePath = path.join(__dirname, '../../uploads', file.fileName);
  
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('File not found on server');
  }

  res.download(filePath, file.originalName);
}));

// DELETE /files/:id - Delete file
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const file = await File.findOne({ 
    _id: req.params.id,
    uploadedBy: req.user._id 
  });
  
  if (!file) {
    throw new NotFoundError('File not found or unauthorized');
  }

  // Delete physical file
  const filePath = path.join(__dirname, '../../uploads', file.fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete database record
  await file.deleteOne();

  res.json({ success: true, data: { message: 'File deleted successfully' } });
}));

// GET /files/user/:userId - Get user files
router.get('/user/:userId', authenticate, asyncHandler(async (req, res) => {
  const files = await File.find({ uploadedBy: req.params.userId })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: files });
}));

// GET /files/entity/:entity/:entityId - Get files by entity
router.get('/entity/:entity/:entityId', authenticate, asyncHandler(async (req, res) => {
  const files = await File.find({ 
    relatedEntity: req.params.entity,
    relatedEntityId: req.params.entityId 
  });
  res.json({ success: true, data: files });
}));

module.exports = router;
