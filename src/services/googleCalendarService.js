const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Calendar Service for timetable sync
class GoogleCalendarService {
  constructor() {
    this.calendar = null;
    this.initialized = false;
  }

  // Initialize Google Calendar API
  async initialize() {
    if (this.initialized) return;

    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
      );

      // Check for stored credentials
      const credentialsPath = path.join(__dirname, '../../google-credentials.json');
      
      if (fs.existsSync(credentialsPath)) {
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        oauth2Client.setCredentials(credentials);
        
        // Check if token needs refresh
        if (credentials.expiry_date < Date.now()) {
          await oauth2Client.refreshAccessToken();
        }
        
        this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        this.initialized = true;
      }
    } catch (error) {
      console.error('Google Calendar initialization failed:', error.message);
    }
  }

  // Create calendar events from timetable slots
  async syncTimetableToCalendar(timetable, calendarId = 'primary') {
    await this.initialize();

    if (!this.calendar) {
      throw new Error('Google Calendar not initialized');
    }

    const createdEvents = [];
    const academicYear = timetable.academicYear;
    const semester = timetable.semester;

    for (const slot of timetable.schedule) {
      // Generate events for the entire semester (approximately 15 weeks)
      const events = this.generateSemesterEvents(slot, academicYear, semester);
      
      for (const event of events) {
        try {
          const createdEvent = await this.calendar.events.insert({
            calendarId,
            resource: event,
          });
          createdEvents.push(createdEvent.data.id);
        } catch (error) {
          console.error(`Failed to create event for ${slot.courseName}:`, error.message);
        }
      }
    }

    return createdEvents;
  }

  // Generate recurring events for a semester
  generateSemesterEvents(slot, academicYear, semester) {
    const events = [];
    const dayMap = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };

    const dayOfWeek = dayMap[slot.day];
    if (!dayOfWeek) return events;

    // Calculate start date based on semester
    const startDate = this.getSemesterStartDate(academicYear, semester);
    
    // Find first occurrence of the day
    const firstDay = new Date(startDate);
    firstDay.setDate(firstDay.getDate() + ((dayOfWeek - firstDay.getDay() + 7) % 7));

    // Generate events for 15 weeks
    for (let week = 0; week < 15; week++) {
      const eventDate = new Date(firstDay);
      eventDate.setDate(firstDay.getDate() + (week * 7));

      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);

      const dateStr = eventDate.toISOString().split('T')[0];
      
      const event = {
        summary: `${slot.courseName} (${slot.courseCode})`,
        description: `Course: ${slot.courseName}\nType: ${slot.type}\nFaculty: ${slot.facultyName || 'TBD'}`,
        location: slot.room || 'TBD',
        start: {
          dateTime: `${dateStr}T${slot.startTime}:00`,
          timeZone: 'Asia/Kolkata'
        },
        end: {
          dateTime: `${dateStr}T${slot.endTime}:00`,
          timeZone: 'Asia/Kolkata'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 30 },
            { method: 'popup', minutes: 15 }
          ]
        }
      };

      events.push(event);
    }

    return events;
  }

  // Get semester start date
  getSemesterStartDate(academicYear, semester) {
    // Assuming semesters: July-Nov (Odd), Dec-May (Even)
    const year = parseInt(academicYear.split('-')[0]);
    
    if (semester === 1 || semester % 2 === 1) {
      // Odd semester - starts July
      return new Date(year, 6, 15); // July 15
    } else {
      // Even semester - starts December
      return new Date(year, 11, 1); // December 1
    }
  }

  // Delete calendar events for a timetable
  async deleteTimetableEvents(eventIds, calendarId = 'primary') {
    await this.initialize();

    if (!this.calendar) {
      throw new Error('Google Calendar not initialized');
    }

    const results = [];
    for (const eventId of eventIds) {
      try {
        await this.calendar.events.delete({
          calendarId,
          eventId
        });
        results.push({ eventId, deleted: true });
      } catch (error) {
        results.push({ eventId, deleted: false, error: error.message });
      }
    }

    return results;
  }

  // Get available calendars
  async listCalendars() {
    await this.initialize();

    if (!this.calendar) {
      return [];
    }

    const response = await this.calendar.calendarList.list();
    return response.data.items;
  }

  // Generate auth URL for OAuth
  getAuthUrl() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
    );

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    });
  }

  // Handle OAuth callback
  async handleCallback(code) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    // Save tokens
    const credentialsPath = path.join(__dirname, '../../google-credentials.json');
    fs.writeFileSync(credentialsPath, JSON.stringify(tokens));

    // Initialize with new tokens
    this.initialized = false;
    await this.initialize();

    return tokens;
  }
}

module.exports = new GoogleCalendarService();
