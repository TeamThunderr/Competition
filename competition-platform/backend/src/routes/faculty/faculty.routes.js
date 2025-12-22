// File Name: faculty.routes.js
// Purpose: Routes for faculty features
// Written for beginner developers

const express = require('express');
const router = express.Router();
const facultyController = require('../../controllers/faculty/faculty.controller');
const verificationController = require('../../controllers/faculty/verification.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/role.middleware');

// 1. Auth & Role Guards
router.use(authMiddleware);
router.use(roleMiddleware('FACULTY'));

router.get('/students', facultyController.getMyStudents);

// Verification Routes
router.get('/pending-verifications', verificationController.getPendingVerifications);
router.post('/verify-registration', verificationController.verifyRegistration);

module.exports = router;
