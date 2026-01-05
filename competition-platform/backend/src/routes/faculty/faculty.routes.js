// File Name: faculty.routes.js
// Purpose: Routes for faculty features
// Written for beginner developers

const express = require('express');
const router = express.Router();
const facultyController = require('../../controllers/faculty/faculty.controller');
const verificationController = require('../../controllers/faculty/verification.controller');
const facultyCompetitionController = require('../../controllers/faculty/competition.controller');
const participationController = require('../../controllers/faculty/participation.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/role.middleware');

// 1. Auth & Role Guards
router.use(authMiddleware);
router.use(roleMiddleware('FACULTY'));

router.get('/students', facultyController.getMyStudents);
router.get('/stats', facultyController.getStats); // Existing, maybe deprecated?
router.get('/dashboard-stats', facultyController.getDashboardStats); // New
router.get('/registrations', facultyController.getRecentRegistrations); // New
router.get('/students/:studentId', facultyController.getStudentDetails);


const syncCompetitionController = require('../../controllers/faculty/syncCompetition.controller');

// Competition View (Read Only)
router.get('/competitions', facultyCompetitionController.getAllCompetitions);
router.get('/competition/:id', facultyCompetitionController.getCompetitionDetails);
router.get('/competition/:id/students', facultyCompetitionController.getCompetitionStudents); // Need to update this controller too?
router.post('/competition/:competitionId/sync', participationController.syncCompetition);
router.post('/competitions/sync-active', participationController.syncAllCompetitions);
router.get('/competitions/export-report', participationController.exportParticipationStats);

// 3. Sync Competition (New Implementation)
router.post('/sync-competition/:competitionId', syncCompetitionController.syncCompetition);

// Verification Routes
router.get('/pending-verifications', verificationController.getPendingVerifications);
router.post('/verify-registration', verificationController.verifyRegistration);

module.exports = router;
