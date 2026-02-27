// Report Generation Service - PDF/Excel reports
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const StudentResult = require('../models/StudentResult');
const FeePayment = require('../models/FeePayment');

class ReportService {
  // Generate Excel report
  async generateExcelReport(data, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(options.sheetName || 'Report');

    // Add headers
    if (options.headers) {
      worksheet.addRow(options.headers);
      worksheet.getRow(1).font = { bold: true };
    }

    // Add data rows
    if (Array.isArray(data)) {
      data.forEach(row => worksheet.addRow(row));
    }

    // Format columns
    if (options.columnWidths) {
      options.columnWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  // Generate student marksheet
  async generateMarksheet(studentId, semester, academicYear) {
    const results = await StudentResult.find({
      studentId,
      semester: parseInt(semester),
      academicYear
    }).populate('courseId', 'name code credits');

    if (!results.length) {
      throw new Error('No results found');
    }

    const student = await User.findById(studentId);
    
    const data = results.map(r => ({
      courseCode: r.courseId?.code || '',
      courseName: r.courseId?.name || '',
      credits: r.courseId?.credits || 0,
      obtainedMarks: r.obtainedMarks,
      totalMarks: r.totalMarks,
      grade: r.grade,
      gradePoint: r.gradePoint || 0,
      status: r.status
    }));

    // Calculate SGPA
    const totalCredits = data.reduce((sum, c) => sum + c.credits, 0);
    const weightedSum = data.reduce((sum, c) => sum + (c.gradePoint * c.credits), 0);
    const sgpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : 0;

    const reportData = {
      student: {
        name: student.name,
        rollNumber: student.rollNumber,
        enrollmentNumber: student.enrollmentNumber,
        semester,
        academicYear
      },
      courses: data,
      summary: {
        totalCredits,
        sgpa,
        totalMarks: data.reduce((sum, c) => sum + c.obtainedMarks, 0),
        totalMaxMarks: data.reduce((sum, c) => sum + c.totalMarks, 0),
        passCount: data.filter(c => c.status === 'pass').length,
        failCount: data.filter(c => c.status === 'fail').length
      }
    };

    // Generate Excel
    const buffer = await this.generateExcelReport(
      data.map(d => [d.courseCode, d.courseName, d.credits, d.obtainedMarks, d.totalMarks, d.grade, d.gradePoint, d.status]),
      {
        headers: ['Course Code', 'Course Name', 'Credits', 'Obtained', 'Total', 'Grade', 'Grade Point', 'Status'],
        sheetName: `Semester ${semester}`,
        columnWidths: [15, 30, 10, 12, 12, 10, 12, 10]
      }
    );

    return {
      buffer,
      filename: `marksheet_${student.rollNumber}_sem${semester}.xlsx`,
      data: reportData
    };
  }

  // Generate attendance report
  async generateAttendanceReport(courseId, startDate, endDate) {
    const attendance = await Attendance.find({
      courseId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('studentId', 'name rollNumber');

    const course = await Course.findById(courseId).populate('departmentId', 'name');

    // Group by student
    const studentAttendance = {};
    attendance.forEach(a => {
      const sid = a.studentId._id.toString();
      if (!studentAttendance[sid]) {
        studentAttendance[sid] = {
          name: a.studentId.name,
          rollNumber: a.studentId.rollNumber,
          present: 0,
          absent: 0,
          late: 0,
          total: 0
        };
      }
      studentAttendance[sid][a.status]++;
      studentAttendance[sid].total++;
    });

    // Calculate percentages
    const reportData = Object.values(studentAttendance).map(s => ({
      ...s,
      percentage: s.total > 0 ? ((s.present + s.late * 0.5) / s.total * 100).toFixed(2) : 0
    }));

    const buffer = await this.generateExcelReport(
      reportData.map(d => [d.name, d.rollNumber, d.present, d.absent, d.late, d.total, d.percentage + '%']),
      {
        headers: ['Name', 'Roll No', 'Present', 'Absent', 'Late', 'Total', 'Percentage'],
        sheetName: 'Attendance',
        columnWidths: [25, 15, 10, 10, 10, 10, 12]
      }
    );

    return {
      buffer,
      filename: `attendance_${course.code}_${startDate}_${endDate}.xlsx`,
      course: course.name,
      dateRange: { startDate, endDate }
    };
  }

  // Generate fee report
  async generateFeeReport(departmentId, semester, academicYear) {
    const query = {};
    if (departmentId) query.departmentId = departmentId;
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;

    const payments = await FeePayment.find(query).populate('studentId', 'name rollNumber email');

    const data = payments.map(p => ({
      name: p.studentId?.name || '',
      rollNumber: p.studentId?.rollNumber || '',
      feeType: p.feeType,
      amount: p.amount,
      paidAmount: p.paidAmount || 0,
      paymentDate: p.paymentDate ? p.paymentDate.toISOString().split('T')[0] : '',
      status: p.status,
      transactionId: p.transactionId || ''
    }));

    // Summary
    const summary = {
      totalStudents: payments.length,
      paid: payments.filter(p => p.status === 'paid').length,
      pending: payments.filter(p => p.status === 'pending').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalCollected: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.paidAmount || 0), 0)
    };

    const buffer = await this.generateExcelReport(
      data.map(d => [d.name, d.rollNumber, d.feeType, d.amount, d.paidAmount, d.paymentDate, d.status, d.transactionId]),
      {
        headers: ['Name', 'Roll No', 'Fee Type', 'Amount', 'Paid', 'Date', 'Status', 'Transaction ID'],
        sheetName: 'Fee Report',
        columnWidths: [25, 15, 20, 12, 12, 15, 12, 25]
      }
    );

    return {
      buffer,
      filename: `fee_report_${academicYear}_sem${semester}.xlsx`,
      summary,
      academicYear,
      semester
    };
  }

  // Generate faculty workload report
  async generateWorkloadReport(departmentId, academicYear) {
    const courses = await Course.find({
      department: departmentId,
      academicYear
    }).populate('faculty', 'name');

    const data = courses.map(c => ({
      facultyName: c.faculty?.name || 'Not Assigned',
      courseCode: c.code,
      courseName: c.name,
      credits: c.credits,
      semester: c.semester,
      studentCount: 0, // TODO: Get enrolled count
      lectureHours: c.credits * 2, // Approximate
      tutorialHours: c.credits,
      practicalHours: c.credits
    }));

    const buffer = await this.generateExcelReport(
      data.map(d => [d.facultyName, d.courseCode, d.courseName, d.credits, d.semester, d.studentCount, d.lectureHours, d.tutorialHours, d.practicalHours]),
      {
        headers: ['Faculty', 'Code', 'Course', 'Credits', 'Semester', 'Students', 'Lecture Hrs', 'Tutorial Hrs', 'Practical Hrs'],
        sheetName: 'Workload',
        columnWidths: [20, 12, 30, 10, 10, 10, 12, 12, 12]
      }
    );

    return {
      buffer,
      filename: `workload_${academicYear}.xlsx`
    };
  }

  // Generate grade distribution report
  async generateGradeReport(courseId, semester, academicYear) {
    const results = await StudentResult.find({
      courseId,
      semester: parseInt(semester),
      academicYear
    });

    const gradeDistribution = {};
    results.forEach(r => {
      const grade = r.grade || 'N/A';
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    const data = Object.entries(gradeDistribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: ((count / results.length) * 100).toFixed(2)
    }));

    const buffer = await this.generateExcelReport(
      data.map(d => [d.grade, d.count, d.percentage + '%']),
      {
        headers: ['Grade', 'Count', 'Percentage'],
        sheetName: 'Grade Distribution',
        columnWidths: [15, 15, 15]
      }
    );

    return {
      buffer,
      filename: `grade_distribution_${courseId}_sem${semester}.xlsx`,
      totalStudents: results.length,
      distribution: data
    };
  }

  // Generate student list report
  async generateStudentList(departmentId, semester) {
    const query = { role: 'student', isActive: true };
    if (departmentId) query.department = departmentId;
    
    const students = await User.find(query).select('name email rollNumber enrollmentNumber phone');

    const data = students.map(s => ({
      name: s.name,
      email: s.email,
      rollNumber: s.rollNumber || '',
      enrollmentNumber: s.enrollmentNumber || '',
      phone: s.phone || ''
    }));

    const buffer = await this.generateExcelReport(
      data.map(d => [d.name, d.email, d.rollNumber, d.enrollmentNumber, d.phone]),
      {
        headers: ['Name', 'Email', 'Roll No', 'Enrollment No', 'Phone'],
        sheetName: 'Students',
        columnWidths: [25, 35, 15, 20, 15]
      }
    );

    return {
      buffer,
      filename: `student_list_dept_${departmentId || 'all'}.xlsx`,
      totalStudents: students.length
    };
  }

  // Generate comprehensive academic report
  async generateAcademicTranscript(studentId) {
    const results = await StudentResult.find({ studentId })
      .populate('courseId', 'name code credits department')
      .sort({ semester: 1, academicYear: 1 });

    const student = await User.findById(studentId);

    // Group by semester
    const semesters = {};
    results.forEach(r => {
      const key = `${r.academicYear}-${r.semester}`;
      if (!semesters[key]) {
        semesters[key] = { courses: [], totalCredits: 0, totalPoints: 0 };
      }
      semesters[key].courses.push(r);
      semesters[key].totalCredits += r.courseId?.credits || 0;
      semesters[key].totalPoints += (r.gradePoint || 0) * (r.courseId?.credits || 0);
    });

    // Calculate CGPA
    let totalCredits = 0;
    let totalPoints = 0;
    Object.values(semesters).forEach(s => {
      totalCredits += s.totalCredits;
      totalPoints += s.totalPoints;
    });
    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    const buffer = await this.generateExcelReport(
      results.map(r => [
        r.academicYear,
        r.semester,
        r.courseId?.code,
        r.courseId?.name,
        r.courseId?.credits,
        r.obtainedMarks,
        r.totalMarks,
        r.grade,
        r.gradePoint,
        r.status
      ]),
      {
        headers: ['Year', 'Sem', 'Code', 'Course', 'Credits', 'Marks', 'Total', 'Grade', 'GP', 'Status'],
        sheetName: 'Transcript',
        columnWidths: [10, 8, 12, 30, 10, 10, 10, 10, 8, 10]
      }
    );

    return {
      buffer,
      filename: `transcript_${student.rollNumber}.xlsx`,
      student: {
        name: student.name,
        rollNumber: student.rollNumber,
        enrollmentNumber: student.enrollmentNumber
      },
      cgpa,
      totalCredits,
      semesters: Object.keys(semesters).length
    };
  }
}

module.exports = new ReportService();
