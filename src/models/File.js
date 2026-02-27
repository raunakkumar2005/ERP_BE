const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['assignment', 'certificate', 'document', 'avatar', 'other'],
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedEntity: {
    type: String
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

// Indexes
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ relatedEntity: 1, relatedEntityId: 1 });
fileSchema.index({ type: 1 });

module.exports = mongoose.model('File', fileSchema);
