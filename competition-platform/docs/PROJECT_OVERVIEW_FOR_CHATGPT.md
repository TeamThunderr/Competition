# 🎓 College Competition Intelligence Platform - Project Overview

## **Project Summary**
A full-stack web application that automates tracking of student participation in external hackathons and competitions. The system replaces manual spreadsheet tracking with intelligent Gmail-based detection and provides role-based dashboards for students, faculty, and administrators.

## **Tech Stack**

### **Frontend**
- **React 19** with **Vite** (fast development)
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Recharts** for data visualization

### **Backend**
- **Node.js** with **Express.js**
- **Supabase** (PostgreSQL) as database
- **Google Gmail API** for email integration
- **Multer** for file uploads
- **OAuth 2.0** for authentication

## **Database Schema**

### **Core Tables**
```sql
-- User management with role-based access
users (id, email, full_name, role, department_id, registration_no, admission_year, cgpa)
departments (id, name)

-- Competition management
competitions (id, title, description, organizer, platform, registration_deadline, event_date)
registrations (user_id, competition_id, source, proof_url, verified, verified_by)
competition_status (user_id, competition_id, is_shortlisted, is_winner)

-- Workflow management
od_requests (user_id, competition_id, reason, status, approved_by)
teams (id, competition_id, leader_id, team_name)
team_members (team_id, user_id)
```

### **User Roles**
- **STUDENT**: Register for competitions, upload proofs, request OD
- **FACULTY**: Verify student registrations, manage section students
- **HOD**: Approve OD requests, view department analytics
- **ADMIN**: Manage competitions, system-wide statistics

## **Key Features**

### **1. Gmail-Based Registration Detection**
```javascript
// Intelligent email parsing with confidence scoring
const detectHackathonStatus = (emailData) => {
    // Analyzes subject, snippet, sender
    // Returns: { status: 'REGISTERED|QUALIFIED|REJECTED', confidence: 95 }
};
```

**Detection Logic:**
- **Platform matching**: Email from devfolio.co, unstop.com (+40 points)
- **Date validation**: Within registration window (+25 points)
- **Token matching**: Competition name in email (+20 points)
- **Status keywords**: Registration confirmed, shortlisted, etc. (+15 points)

### **2. Role-Based Dashboards**

**Student Dashboard:**
- View registered competitions
- Gmail verification with one-click
- Manual proof upload (screenshots)
- OD request submission
- Competition status tracking

**Faculty Dashboard:**
- Section-wise student management
- Verify manual proofs
- Sync competition data
- Download participation reports
- Real-time statistics

**HOD Dashboard:**
- Department analytics (batch-wise, year-wise)
- OD approval workflow
- Faculty performance overview
- Competition participation metrics

### **3. Verification Workflow**
1. **Auto-Detection**: Gmail API scans for registration emails
2. **Manual Fallback**: Students upload screenshot proofs
3. **Faculty Verification**: Manual proofs require approval
4. **OD Process**: Shortlisted students request On-Duty approval

## **Project Structure**

```
├── backend/
│   ├── src/
│   │   ├── controllers/     # API request handlers (by role)
│   │   ├── services/        # Business logic
│   │   │   └── gmailService.js  # Core Gmail integration
│   │   ├── middleware/      # Auth & validation
│   │   ├── routes/          # API endpoints
│   │   └── config/          # Database & environment
│   └── Database/            # SQL schemas
├── frontend/
│   ├── src/
│   │   ├── pages/           # Role-based page components
│   │   ├── components/      # Reusable UI components
│   │   └── services/        # API clients
└── Root configuration files
```

## **API Architecture**

### **Authentication**
```javascript
// Current: Demo mode with header-based auth
headers: { 'x-user-id': userId }

// Production: JWT-based authentication
headers: { 'Authorization': 'Bearer <token>' }
```

### **Key Endpoints**
```javascript
// Student endpoints
POST /api/student/check-status     // Gmail verification
POST /api/student/upload-proof     // Manual proof upload
POST /api/student/request-od       // OD request

// Faculty endpoints
GET  /api/faculty/students         // Section students
POST /api/faculty/verify-proof     // Approve/reject proofs
GET  /api/faculty/dashboard-stats  // Section statistics

// HOD endpoints
GET  /api/hod/pending-od          // Pending OD requests
POST /api/hod/manage-od           // Approve/reject OD
GET  /api/hod/dashboard-analysis  // Department analytics
```

## **Gmail Integration Details**

### **OAuth Scopes**
```javascript
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
```

### **Email Matching Algorithm**
```javascript
const calculateMatchScore = (email, competition) => {
    // Platform match: devfolio.co, unstop.com (+40)
    // Date window: registration period (+25)
    // Token match: competition name (+20)
    // Organizer match: company name (+20)
    // Status detection: keywords (+15)
    // Total score determines confidence level
};
```

### **Status Detection Keywords**
```javascript
REGISTERED: ['registration successful', 'registration confirmed', 'thank you for registering']
QUALIFIED: ['shortlisted', 'qualified for next round', 'selected for', 'moved to next round']
REJECTED: ['not selected', 'unfortunately', 'regret to inform', 'did not qualify']
```

## **Current Status**

### **✅ Implemented**
- Complete CRUD operations
- Role-based dashboards
- Gmail service logic (90% complete)
- File upload functionality
- Basic analytics and reporting
- Responsive UI design

### **🟡 Demo/Prototype Mode**
- Authentication: Header-based (not production-ready)
- Gmail OAuth: Logic complete, flow needs connection
- Security: Demo mode for rapid development

### **❌ Missing for Production**
- JWT authentication implementation
- Input validation (Joi/Zod)
- Comprehensive error handling
- Unit/integration tests
- Docker containerization
- Rate limiting and security hardening

## **Environment Setup**

### **Required Services**
- **Supabase**: Database and storage
- **Google Cloud Console**: Gmail API credentials
- **Node.js 18+**: Runtime environment

### **Environment Variables**
```bash
# Backend (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## **Business Logic Highlights**

### **Competition Lifecycle**
1. **Admin uploads** competitions via Excel/manual entry
2. **Students register** and system detects via Gmail
3. **Faculty verifies** manual proofs if auto-detection fails
4. **Students request OD** if shortlisted
5. **HOD approves/rejects** OD requests
6. **System tracks** final outcomes (winner/participant)

### **Data Flow**
```
Gmail API → Email Analysis → Status Detection → Database Update → Dashboard Refresh
```

### **Scoring System**
- **High Confidence (60+)**: Auto-approve registration
- **Medium Confidence (40-59)**: Flag for faculty review
- **Low Confidence (<40)**: Require manual proof

## **Key Files to Understand**

1. **`backend/src/services/gmailService.js`** - Core Gmail integration logic
2. **`backend/Database/SCHEMA.SQL`** - Complete database structure
3. **`frontend/src/pages/student/StudentDashboard.jsx`** - Main student interface
4. **`backend/src/middleware/authMiddleware.js`** - Authentication logic
5. **`frontend/src/services/api.js`** - API client with auto-headers

## **Unique Features**

1. **Intelligent Email Parsing**: Advanced keyword matching with confidence scoring
2. **Multi-Platform Support**: Works with Devfolio, Unstop, and custom platforms
3. **Fallback Mechanisms**: Manual proof upload when auto-detection fails
4. **Role-Based Workflows**: Different interfaces for each user type
5. **Real-Time Analytics**: Live dashboards with participation metrics

This platform solves a real problem in academic institutions by automating the tedious process of tracking student competition participation while providing transparency and accountability through proper verification workflows.