// File Name: server.js
// Purpose: Main entry point for the backend server
// Written for beginner developers

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow requests from frontend
app.use(express.json()); // Parse JSON bodies

// Basic Route
app.get('/', (req, res) => {
    res.send('College Competition Platform Backend is Running');
});

// Import Routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const facultyRoutes = require('./routes/faculty.routes');
const hodRoutes = require('./routes/hod.routes');
const adminRoutes = require('./routes/admin.routes');

// Use Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/admin', adminRoutes);

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
