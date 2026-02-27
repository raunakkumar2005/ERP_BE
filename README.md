# Delhi University ERP Backend

Node.js + Express backend for Delhi University College Management ERP System, NEP 2020 compliant.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Security**: Helmet, CORS, Rate Limiting

## Features
- Role-based access control (Admin, HoD, Faculty, Student)
- Course management & registration
- Attendance tracking
- Assignment & submission management
- Fee management
- Grievance handling
- Extracurricular activities with NEP 2020 points
- Timetable management with OCR support
- Google Calendar sync
- Mentorship system
- Approval workflows
- Student results & grades
- Analytics & reporting
- Excel report generation

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your configuration
# Required: MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET
```

### Running the Application

```bash
# Development
npm run dev

# Production
npm start
```

### API Base URL
```
http://localhost:3000/api/v1
```

## Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run specific test files:
```bash
# Authentication tests
npm run test:auth

# User tests
npm run test:users

# Unit tests only
npm run test:unit
```

### Test Structure
```
tests/
├── setup.js        # Test configuration
├── auth.test.js    # Authentication tests
└── users.test.js  # User endpoint tests
```

## Project Structure
```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware (auth, validation, error)
├── models/         # Mongoose schemas
├── routes/         # Express routers
├── services/       # Business logic services
│   ├── analyticsService.js
│   ├── emailService.js
│   ├── googleCalendarService.js
│   ├── ocrService.js
│   └── reportService.js
├── utils/          # Utility functions
└── app.js          # Application entry point
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register (Admin)
- `POST /auth/refresh-token` - Refresh token
- `POST /auth/logout` - Logout

### Users
- `GET /users/profile` - Get profile
- `PUT /users/profile` - Update profile
- `PUT /users/password` - Change password

### More endpoints in src/routes/

## Integrations

### Email Notifications
Configure SMTP in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Google Calendar
1. Create Google Cloud project
2. Enable Calendar API
3. Add credentials to `.env`:
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/timetable/google-callback
```

### OCR (Timetable)
Uses Tesseract.js for processing timetable images. No additional configuration needed.

## Security
- JWT tokens with 24h expiry
- Refresh tokens with 30d expiry
- Rate limiting: 1000 requests/hour
- Password hashing with bcrypt (10 rounds)
- Input validation with Joi

## License
MIT
