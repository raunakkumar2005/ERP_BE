const Tesseract = require('tesseract.js');
const { v4: uuidv4 } = require('uuid');

// OCR Service for timetable image processing
class OCRService {
  constructor() {
    this.processingJobs = new Map();
  }

  // Process timetable image
  async processTimetable(imageBuffer, options = {}) {
    const jobId = uuidv4();
    
    try {
      this.processingJobs.set(jobId, { status: 'processing', startedAt: new Date() });

      // Perform OCR on the image
      const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            this.processingJobs.set(jobId, { 
              status: 'processing', 
              progress,
              startedAt: this.processingJobs.get(jobId)?.startedAt 
            });
          }
        }
      });

      // Parse the extracted text into timetable slots
      const slots = this.parseTimetableText(text, options);

      this.processingJobs.set(jobId, { 
        status: 'completed', 
        completedAt: new Date(),
        slots 
      });

      return { jobId, status: 'completed', slots };

    } catch (error) {
      this.processingJobs.set(jobId, { 
        status: 'failed', 
        error: error.message,
        failedAt: new Date()
      });
      throw error;
    }
  }

  // Get job status
  getJobStatus(jobId) {
    return this.processingJobs.get(jobId) || { status: 'not_found' };
  }

  // Parse OCR text into structured timetable data
  parseTimetableText(text, options = {}) {
    const slots = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // Common patterns in timetable images
    const dayPatterns = {
      'monday': 'monday',
      'tue': 'tuesday', 
      'tues': 'tuesday',
      'wednesday': 'wednesday',
      'wed': 'wednesday',
      'thursday': 'thursday',
      'thurs': 'thursday',
      'friday': 'friday',
      'fri': 'friday',
      'saturday': 'saturday',
      'sat': 'saturday'
    };

    // Time pattern (e.g., 9:00 AM, 10:30)
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
    
    // Room pattern
    const roomPattern = /(room|r\.?|lab|lh|lt)(\s*#?\s*)(\w+)/i;

    // Course code pattern
    const coursePattern = /([A-Z]{2,4})\s*(\d{3,4})/;

    let currentDay = null;
    let currentTime = null;

    for (const line of lines) {
      // Try to detect day
      const lowerLine = line.toLowerCase();
      for (const [pattern, day] of Object.entries(dayPatterns)) {
        if (lowerLine.includes(pattern)) {
          currentDay = day;
          break;
        }
      }

      // Try to detect time
      const timeMatch = line.match(timePattern);
      if (timeMatch) {
        currentTime = this.formatTime(timeMatch);
      }

      // Try to detect course
      const courseMatch = line.match(coursePattern);
      if (courseMatch && currentDay && currentTime) {
        slots.push({
          courseCode: `${courseMatch[1]}${courseMatch[2]}`,
          day: currentDay,
          startTime: currentTime,
          endTime: this.calculateEndTime(currentTime, 60), // Default 1 hour
          room: this.extractRoom(line),
          type: this.detectClassType(line)
        });
      }
    }

    return slots;
  }

  formatTime(timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    const meridiem = timeMatch[3]?.toUpperCase();

    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  calculateEndTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  extractRoom(line) {
    const match = line.match(/(?:room|r\.?|lab|lh|lt)\s*#?\s*(\w+)/i);
    return match ? match[1] : null;
  }

  detectClassType(line) {
    const lower = line.toLowerCase();
    if (lower.includes('lab') || lower.includes('practical')) return 'practical';
    if (lower.includes('tutorial') || lower.includes('tut')) return 'tutorial';
    return 'lecture';
  }

  // Preprocess image for better OCR results
  async preprocessImage(imageBuffer) {
    // In production, you might use sharp or jimp for image preprocessing
    // This is a placeholder for image enhancement
    return imageBuffer;
  }
}

module.exports = new OCRService();
