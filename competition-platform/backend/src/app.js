const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth/auth.routes');
const studentRoutes = require('./routes/student/student.routes');
const facultyRoutes = require('./routes/faculty/faculty.routes');
const hodRoutes = require('./routes/hod/hod.routes');
const adminRoutes = require('./routes/admin/admin.routes');
const { globalLimiter, authLimiter, adminLimiter } = require('./middleware/rateLimiter.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const loggerMiddleware = require('./utils/logger');

const app = express();

// Trust reverse proxy (needed for Rate Limiter when behind Render/Nginx)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());

// Dynamic CORS Setup
const allowedOrigins = process.env.ALLOWED_ORIGIN 
    ? [process.env.ALLOWED_ORIGIN, 'http://localhost:5173', 'http://localhost:3000']
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Rate Limiter
app.use(globalLimiter);

app.use(express.json());
app.use(loggerMiddleware);

// Routes
const gmailOAuthRouter = require('./routes/auth/gmailOAuth.routes');
app.use('/api/auth/gmail', gmailOAuthRouter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/competitions', require('./routes/core/competition.routes'));
app.use('/api/teams', require('./routes/core/team.routes'));
app.use('/api/approvals', require('./routes/core/approval.routes'));

// Error Handler
app.use(errorHandler);

// Export app to be used in server.js
module.exports = app;
