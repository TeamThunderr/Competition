const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth/auth.routes');
const studentRoutes = require('./routes/student/student.routes');
const facultyRoutes = require('./routes/faculty/faculty.routes');
const hodRoutes = require('./routes/hod/hod.routes');
const adminRoutes = require('./routes/admin/admin.routes');
const errorHandler = require('./utils/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/competitions', require('./routes/core/competition.routes'));
app.use('/api/teams', require('./routes/core/team.routes'));
app.use('/api/approvals', require('./routes/core/approval.routes'));
app.use('/api/gmail', require('./routes/gmail/gmail.routes'));
// Error Handler
app.use(errorHandler);

// Export app to be used in server.js
module.exports = app;
