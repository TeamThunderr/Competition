const express = require('express');
const router = express.Router();
const facultyController = require('../../controllers/faculty/faculty.controller');
const verificationController = require('../../controllers/faculty/verification.controller');
const facultyCompetitionController = require('../../controllers/faculty/competition.controller');
const teamVerificationController = require('../../controllers/faculty/team_verification.controller');
const uploadController = require('../../controllers/faculty/upload.controller');
const excelUploadMiddleware = require('../../middleware/excelUploadMiddleware');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/role.middleware');

// 1. Auth & Role Guards
router.use(authMiddleware);
router.use(roleMiddleware('FACULTY'));

// Student Management
router.get('/students', facultyController.getMyStudents);
router.get('/students/:studentId', facultyController.getStudentDetails);
router.post('/students/upload', excelUploadMiddleware.single('file'), uploadController.bulkUploadStudents);

// Data & Stats
router.get('/stats', facultyController.getStats); // Legacy
router.get('/dashboard-stats', facultyController.getDashboardStats); // V2 Logic
router.get('/registrations', facultyController.getRecentRegistrations);

// Feature: Competition View & Sync
router.get('/competitions', facultyCompetitionController.getAllCompetitions);
router.get('/competition/:id', facultyCompetitionController.getCompetitionDetails);
router.get('/competition/:id/students', facultyCompetitionController.getCompetitionStudents);

// V2 Sync Routes
router.post('/competition/:competitionId/sync', facultyController.syncCompetition);
router.get('/competition-sync-status', facultyController.getCompetitionSyncStatus); // New route if needed by frontend

// Verification Routes (Student Registration)
router.get('/pending-verifications', facultyController.getPendingVerifications);
router.post('/verify-registration', facultyController.verifyRegistration);

// Verification Routes (Shortlist)
router.get('/pending-shortlists', facultyController.getPendingShortlistVerifications);
router.post('/verify-shortlist', facultyController.verifyShortlist);

// Team Verification Routes
router.get('/pending-teams', teamVerificationController.getPendingTeamVerifications);
router.post('/verify-team', teamVerificationController.verifyTeam);

module.exports = router;
