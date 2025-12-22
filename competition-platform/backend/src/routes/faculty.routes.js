// File Name: faculty.routes.js
// Purpose: Define API routes for Faculty operations
// Written for beginner developers

const express = require('express');
const router = express.Router();
const roleMiddleware = require('../../middleware/roleMiddleware');
const facultyController = require('../../controllers/faculty/faculty.controller');

// Middleware: All routes here require FACULTY role
router.use(roleMiddleware(['FACULTY']));

// Verify Registration (Approve/Reject Proof)
router.post('/verify', facultyController.verifyStudentRegistration);

module.exports = router;
