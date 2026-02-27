// Analytics Service for data aggregation and reporting
const User = require('../models/User');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const StudentResult = require('../models/StudentResult');
const FeePayment = require('../models/FeePayment');
const Notice = require('../models/Notice');
const ExtracurricularActivity = require('../models/ExtracurricularActivity');
const Grievance = require('../models/Grievance');
const ApprovalRequest = require('../models/ApprovalRequest');

class AnalyticsService {
  // Get dashboard analytics based on role
  async getDashboardAnalytics(user, period = 'month') {
    const stats = {};
    
    switch (user.role) {
      case 'admin':
        stats.totalStudents = await User.countDocuments({ role: 'student', isActive: true });
        stats.totalFaculty = await User.countDocuments({ role: { $in: ['faculty', 'hod'] }, isActive: true });
        stats.totalCourses = await Course.countDocuments();
        stats.totalDepartments = 0; // TODO: Add Department count
        break;
        
      case 'hod':
        stats.totalFaculty = await User.countDocuments({ department: user.department, role: { $in: ['faculty'] }, isActive: true });
        stats.totalStudents = await User.countDocuments({ department: user.department, role: 'student', isActive: true });
        stats.totalCourses = await Course.countDocuments({ department: user.department });
        stats.pendingApprovals = await ApprovalRequest.countDocuments({ currentApprover: user._id, status: 'pending' });
        break;
        
      case 'faculty':
        stats.totalCourses = await Course.countDocuments({ faculty: user._id });
        stats.totalStudents = await Course.countDocuments({ faculty: user._id });
        stats.pendingAssignments = 0; // TODO: Add assignment count
        break;
        
      case 'student':
        stats.myCourses = 0; // TODO: Add enrolled courses
        stats.myAttendance = await this.getStudentAttendancePercentage(user._id);
        stats.myGPA = 0; // TODO: Add GPA calculation
        break;
    }

    return stats;
  }

  // Get attendance analytics
  async getAttendanceAnalytics(filters = {}) {
    const { departmentId, courseId, startDate, endDate } = filters;
    
    const matchStage = {};
    if (departmentId) matchStage.departmentId = departmentId;
    if (courseId) matchStage.courseId = courseId;
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const attendancePipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
        }
      }
    ];

    const result = await Attendance.aggregate(attendancePipeline);
    
    if (result.length === 0) {
      return { overall: 0, byCourse: [], byMonth: [], trends: [] };
    }

    const { total, present, late } = result[0];
    const overall = total > 0 ? ((present + late * 0.5) / total) * 100 : 0;

    return {
      overall: Math.round(overall * 100) / 100,
      byCourse: [],
      byMonth: [],
      trends: []
    };
  }

  // Get academic performance analytics
  async getAcademicPerformanceAnalytics(departmentId) {
    const matchStage = departmentId ? { department: departmentId } : {};

    const results = await StudentResult.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $group: {
          _id: null,
          avgMarks: { $avg: '$obtainedMarks' },
          passCount: { $sum: { $cond: [{ $eq: ['$status', 'pass'] }, 1, 0] } },
          failCount: { $sum: { $cond: [{ $eq: ['$status', 'fail'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);

    if (results.length === 0) {
      return { avgCGPA: 0, passRate: 0, topPerformers: [], trends: [] };
    }

    const { avgMarks, passCount, total } = results[0];
    const passRate = total > 0 ? (passCount / total) * 100 : 0;

    return {
      avgCGPA: Math.round(avgMarks / 10 * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      topPerformers: [],
      trends: []
    };
  }

  // Get department overview for HoD
  async getDepartmentOverview(departmentId) {
    const faculty = await User.aggregate([
      { $match: { department: departmentId, role: 'faculty', isActive: true } },
      { $count: 'count' }
    ]);

    const students = await User.aggregate([
      { $match: { department: departmentId, role: 'student', isActive: true } },
      { $count: 'count' }
    ]);

    const courses = await Course.aggregate([
      { $match: { department: departmentId } },
      { $count: 'count' }
    ]);

    const attendance = await this.getAttendanceAnalytics({ departmentId });

    return {
      faculty: { count: faculty[0]?.count || 0 },
      students: { count: students[0]?.count || 0 },
      courses: { count: courses[0]?.count || 0 },
      performance: attendance
    };
  }

  // Get system usage analytics (Admin only)
  async getSystemUsageAnalytics() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: last24h } });
    
    const loginsByRole = await User.aggregate([
      { $match: { lastLogin: { $gte: last24h } } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    return {
      activeUsers,
      loginsByRole: loginsByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      featureUsage: {},
      peakHours: []
    };
  }

  // Get student attendance percentage
  async getStudentAttendancePercentage(studentId) {
    const attendance = await Attendance.find({ studentId });
    
    if (attendance.length === 0) return 0;
    
    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const total = attendance.length;
    
    return Math.round(((present + late * 0.5) / total) * 100 * 100) / 100;
  }

  // Get enrollment trends
  async getEnrollmentTrends(departmentId, timeframe = 'semester') {
    // TODO: Implement with actual data
    return [];
  }

  // Get grade distribution
  async getGradeDistribution(courseId, semester, academicYear) {
    const matchStage = {};
    if (courseId) matchStage.courseId = courseId;
    if (semester) matchStage.semester = parseInt(semester);
    if (academicYear) matchStage.academicYear = academicYear;

    const distribution = await StudentResult.aggregate([
      { $match: matchStage },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return distribution.map(d => ({ grade: d._id, count: d.count }));
  }

  // Get fee collection report
  async getFeeCollectionReport(departmentId) {
    const payments = await FeePayment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$paidAmount' }
        }
      }
    ]);

    const structures = await FeePayment.aggregate([
      {
        $group: {
          _id: null,
          totalDue: { $sum: '$amount' }
        }
      }
    ]);

    const totalCollected = payments[0]?.totalCollected || 0;
    const totalDue = structures[0]?.totalDue || 0;
    const collectionRate = totalDue > 0 ? (totalCollected / totalDue) * 100 : 0;

    return {
      totalCollected,
      totalDue,
      collectionRate: Math.round(collectionRate * 100) / 100,
      byDepartment: [],
      bySemester: []
    };
  }

  // Get notice analytics
  async getNoticeAnalytics() {
    const totalNotices = await Notice.countDocuments();
    const readNotices = await Notice.countDocuments({ isRead: true });
    const readRate = totalNotices > 0 ? (readNotices / totalNotices) * 100 : 0;

    const byPriority = await Notice.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    return {
      totalNotices,
      readRate: Math.round(readRate * 100) / 100,
      byPriority: byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentActivity: []
    };
  }

  // Get approval analytics
  async getApprovalAnalytics() {
    const pending = await ApprovalRequest.countDocuments({ status: 'pending' });
    const approved = await ApprovalRequest.countDocuments({ status: 'approved' });
    const rejected = await ApprovalRequest.countDocuments({ status: 'rejected' });

    return {
      pending,
      approved,
      rejected,
      avgProcessingTime: 0 // TODO: Calculate from approval history
    };
  }

  // Get NEP 2020 assessment for student
  async getNEPAssessment(studentId, options = {}) {
    const { includeSkillAssessment, includeCompetencyMapping } = options;

    // Get extracurricular activities
    const activities = await ExtracurricularActivity.find({ studentId });
    
    const totalNEPPoints = activities.reduce((sum, a) => sum + (a.nepPoints || 0), 0);
    
    const byType = activities.reduce((acc, a) => {
      acc[a.activityType] = (acc[a.activityType] || 0) + 1;
      return acc;
    }, {});

    // Get results for multidisciplinary and skill-based courses
    const results = await StudentResult.find({ studentId });
    
    // TODO: Calculate actual credits based on course types
    const multidisciplinaryCredits = 0;
    const skillBasedCredits = 0;

    return {
      multidisciplinaryCredits,
      skillBasedCredits,
      totalNEPPoints,
      holisticProgress: {
        activitiesCount: activities.length,
        byType,
        verified: activities.filter(a => a.verificationStatus === 'verified').length
      },
      competencies: [] // TODO: Add competency mapping
    };
  }
}

module.exports = new AnalyticsService();
