// File Name: student.routes.js
// Purpose: Routes for student features
// Written for beginner developers

const express = require('express');
const router = express.Router();
const competitionController = require('../../controllers/student/competition.controller');
const registrationController = require('../../controllers/student/registration.controller');
const odController = require('../../controllers/student/od.controller');
const studentController = require('../../controllers/student/student.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/role.middleware');
const upload = require('../../middleware/uploadmiddleware');
const validate = require('../../middleware/validate.middleware');
const paginate = require('../../middleware/paginate.middleware');
const { uploadProofSchema, requestOdSchema } = require('../../validation/schemas/student.schema');

// 1. Check Authentication (Who are you?)
router.use(authMiddleware);

// 2. Check Role (Are you a Student?)
router.use(roleMiddleware('STUDENT'));

// --- Routes ---

// Student Search & Validation (for teammate autocomplete)
router.get('/search-students', studentController.searchStudents);
router.post('/validate-teammate', studentController.validateTeammate);

// Competitions (paginated)
router.get('/competitions', competitionController.getAllCompetitions);
router.get('/competition/:id', competitionController.getCompetitionDetails);

// Registration / Verification Flow
router.post('/check-status', registrationController.checkRegistrationStatus);
router.post('/upload-proof', upload.single('proof'), validate(uploadProofSchema), registrationController.uploadProof);
router.post('/upload-shortlist-proof', upload.single('shortlist_proof'), registrationController.uploadShortlistProof);
router.post('/update-winning-status', registrationController.updateWinningStatus);

// OD Requests
router.post('/request-od', validate(requestOdSchema), odController.requestOD);
router.get('/od-requests', odController.getMyODRequests);

// Profile
const profileController = require('../../controllers/student/profile.controller');
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);
router.get('/search', profileController.searchStudent);
router.get('/gmail/status', profileController.checkGmailStatus);

module.exports = router;
