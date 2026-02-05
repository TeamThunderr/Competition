// File Name: student.routes.js
// Purpose: Routes for student features
// Written for beginner developers

const express = require('express');
const router = express.Router();
const competitionController = require('../../controllers/student/competition.controller');
const registrationController = require('../../controllers/student/registration.controller');
const odController = require('../../controllers/student/od.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/role.middleware');

// 1. Check Authentication (Who are you?)
router.use(authMiddleware);

// 2. Check Role (Are you a Student?)
router.use(roleMiddleware('STUDENT'));

// --- Routes ---

// Competitions
router.get('/competitions', competitionController.getAllCompetitions);
router.get('/competition/:id', competitionController.getCompetitionDetails);

// Registration / Verification Flow
router.post('/check-status', registrationController.checkRegistrationStatus);
router.post('/upload-proof', registrationController.uploadProof);
router.post('/upload-shortlist-proof', registrationController.uploadShortlistProof);

// OD Requests
router.post('/request-od', odController.requestOD);
router.get('/od-requests', odController.getMyODRequests);

// Profile
const profileController = require('../../controllers/student/profile.controller');
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);
router.get('/search', profileController.searchStudent);

module.exports = router;
