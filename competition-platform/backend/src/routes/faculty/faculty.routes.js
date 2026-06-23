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
const validate = require('../../middleware/validate.middleware');
const paginate = require('../../middleware/paginate.middleware');
const { verifyRegistrationSchema } = require('../../validation/schemas/faculty.schema');

// 1. Auth & Role Guards
router.use(authMiddleware);
router.use(roleMiddleware('FACULTY'));

// Student Management (students list is paginated)
router.get('/students', paginate, facultyController.getMyStudents);
router.get('/students/:studentId', facultyController.getStudentDetails);
router.post('/students/upload', excelUploadMiddleware.single('file'), uploadController.bulkUploadStudents);

// Data & Stats (registrations list is paginated)
router.get('/stats', facultyController.getStats); // Legacy
router.get('/dashboard-stats', facultyController.getDashboardStats); // V2 Logic
router.get('/registrations', paginate, facultyController.getRecentRegistrations);

// Feature: Competition View & Sync
router.get('/competitions/export-report', facultyController.downloadParticipationReport);
router.get('/competitions', facultyCompetitionController.getAllCompetitions);
// Competition Details & Management
router.get('/competition/:id', facultyCompetitionController.getCompetitionDetails);
router.get('/competition/:id/students', facultyCompetitionController.getCompetitionStudents);
router.get('/competition/:id/export', facultyCompetitionController.exportCompetitionStudents); // New Export Route

const { gmailSyncLimiter } = require('../../middleware/rateLimiter.middleware');

// V2 Sync Routes
router.post('/competition/:id/sync', gmailSyncLimiter, facultyController.syncCompetition);
router.get('/competition-sync-status', facultyController.getCompetitionSyncStatus);

// Verification Routes (Student Registration)
router.get('/pending-verifications', facultyController.getPendingVerifications);
router.post('/verify-registration', validate(verifyRegistrationSchema), facultyController.verifyRegistration);

// Verification Routes (Shortlist)
router.get('/pending-shortlists', facultyController.getPendingShortlistVerifications);
router.post('/verify-shortlist', facultyController.verifyShortlist);

// Verification Routes (Winning)
router.get('/pending-winning', verificationController.getPendingWinningVerifications);
router.post('/verify-winning', verificationController.verifyWinning);

// Team Verification Routes
router.get('/pending-teams', teamVerificationController.getPendingTeamVerifications);
router.post('/verify-team', teamVerificationController.verifyTeam);

module.exports = router;
