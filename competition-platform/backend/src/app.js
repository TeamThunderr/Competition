const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const facultyRoutes = require('./routes/faculty.routes');
const hodRoutes = require('./routes/hod.routes');
const adminRoutes = require('./routes/admin.routes');
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


// Error Handler
app.use(errorHandler);

// Export app to be used in server.js
module.exports = app;
