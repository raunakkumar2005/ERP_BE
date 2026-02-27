const nodemailer = require('nodemailer');

// Email Service for sending notifications
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  // Initialize email transporter
  initialize() {
    if (this.initialized) return;

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.initialized = true;
  }

  // Send email
  async sendEmail(to, subject, html, text = '') {
    this.initialize();

    const mailOptions = {
      from: process.env.SMTP_FROM || '"DU ERP System" <noreply@du-erp.edu.in>',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Delhi University ERP';
    const html = `
      <h1>Welcome, ${user.name}!</h1>
      <p>Your account has been created successfully.</p>
      <p>Role: ${user.role}</p>
      <p>Email: ${user.email}</p>
      <p>Please login to complete your profile.</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <h1>Password Reset</h1>
      <p>You requested a password reset.</p>
      <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  // Send assignment notification
  async sendAssignmentNotification(student, assignment) {
    const subject = `New Assignment: ${assignment.title}`;
    const html = `
      <h1>New Assignment Posted</h1>
      <p>Course: ${assignment.courseName}</p>
      <p>Title: ${assignment.title}</p>
      <p>Due Date: ${new Date(assignment.dueDate).toLocaleDateString()}</p>
      <p>Max Marks: ${assignment.maxMarks}</p>
    `;
    return this.sendEmail(student.email, subject, html);
  }

  // Send grade notification
  async sendGradeNotification(student, result) {
    const subject = `Grade Posted: ${result.courseName}`;
    const html = `
      <h1>Your Grade Has Been Posted</h1>
      <p>Course: ${result.courseName}</p>
      <p>Marks: ${result.obtainedMarks}/${result.totalMarks}</p>
      <p>Grade: ${result.grade}</p>
      <p>Status: ${result.status}</p>
    `;
    return this.sendEmail(student.email, subject, html);
  }

  // Send fee reminder
  async sendFeeReminder(student, feeStructure) {
    const subject = 'Fee Payment Reminder';
    const html = `
      <h1>Fee Payment Reminder</h1>
      <p>Dear ${student.name},</p>
      <p>This is a reminder that your fee payment is due.</p>
      <p>Type: ${feeStructure.name}</p>
      <p>Amount: ₹${feeStructure.amount}</p>
      <p>Due Date: ${new Date(feeStructure.dueDate).toLocaleDateString()}</p>
      <p>Please login to make the payment.</p>
    `;
    return this.sendEmail(student.email, subject, html);
  }

  // Send notice notification
  async sendNoticeNotification(user, notice) {
    const subject = `New Notice: ${notice.title}`;
    const html = `
      <h1>New Notice Posted</h1>
      <h2>${notice.title}</h2>
      <p>${notice.content.substring(0, 200)}...</p>
      <p>Priority: ${notice.priority}</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  // Send grievance status update
  async sendGrievanceUpdate(student, grievance) {
    const subject = `Grievance Status Update: ${grievance.subject}`;
    const html = `
      <h1>Grievance Status Update</h1>
      <p>Your grievance status has been updated.</p>
      <p>Subject: ${grievance.subject}</p>
      <p>Status: ${grievance.status}</p>
      ${grievance.resolution ? `<p>Resolution: ${grievance.resolution}</p>` : ''}
    `;
    return this.sendEmail(student.email, subject, html);
  }

  // Send approval notification
  async sendApprovalNotification(user, approval) {
    const subject = `Approval Request: ${approval.title}`;
    const html = `
      <h1>New Approval Request</h1>
      <p>Type: ${approval.type}</p>
      <p>Title: ${approval.title}</p>
      <p>Priority: ${approval.priority}</p>
      <p>Requested By: ${approval.requesterName}</p>
      <p>Please login to review this request.</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  // Send mentorship assignment notification
  async sendMentorshipNotification(mentor, mentee) {
    const subject = 'New Mentee Assigned';
    const html = `
      <h1>New Mentee Assigned</h1>
      <p>You have been assigned a new mentee.</p>
      <p>Student: ${mentee.name}</p>
      <p>Email: ${mentee.email}</p>
      <p>Please login to view details and set up your first session.</p>
    `;
    return this.sendEmail(mentor.email, subject, html);
  }
}

module.exports = new EmailService();
