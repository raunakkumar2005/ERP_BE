require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes (to be implemented)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const courseRoutes = require('./routes/courses');
const timetableRoutes = require('./routes/timetable');
const noticeRoutes = require('./routes/notices');
const attendanceRoutes = require('./routes/attendance');
const assignmentRoutes = require('./routes/assignments');
const feeRoutes = require('./routes/fees');
const grievanceRoutes = require('./routes/grievances');
const activityRoutes = require('./routes/activities');
const workloadRoutes = require('./routes/workload');
const mentorshipRoutes = require('./routes/mentorship');
const approvalRoutes = require('./routes/approvals');
const resultRoutes = require('./routes/results');
const registrationRoutes = require('./routes/registration');
const analyticsRoutes = require('./routes/analytics');
const fileRoutes = require('./routes/files');
const chartRoutes = require('./routes/charts');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please try again later.',
      details: { retryAfter: 3600 }
    }
  }
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/timetable', timetableRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/grievances', grievanceRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/workload', workloadRoutes);
app.use('/api/v1/mentorship', mentorshipRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/results', resultRoutes);
app.use('/api/v1/registration', registrationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/charts', chartRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'RES_001',
      message: 'Endpoint not found'
    }
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
