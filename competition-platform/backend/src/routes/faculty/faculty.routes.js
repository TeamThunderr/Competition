const express = require('express');
const router = express.Router();
const facultyController = require('../../controllers/faculty/faculty.controller');
const verificationController = require('../../controllers/faculty/verification.controller');
const facultyCompetitionController = require('../../controllers/faculty/competition.controller');
const teamVerificationController = require('../../controllers/faculty/team_verification.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/role.middleware');

// 1. Auth & Role Guards
router.use(authMiddleware);
router.use(roleMiddleware('FACULTY'));

// Student Management
router.get('/students', facultyController.getMyStudents);
router.get('/students/:studentId', facultyController.getStudentDetails);

// Data & Stats
router.get('/stats', facultyController.getStats); // Legacy
router.get('/dashboard-stats', facultyController.getDashboardStats); // V2 Logic
router.get('/registrations', facultyController.getRecentRegistrations);

// Feature: Competition View & Sync
router.get('/competitions', facultyCompetitionController.getAllCompetitions);
router.get('/competition/:id', facultyCompetitionController.getCompetitionDetails);
router.get('/competition/:id/students', facultyCompetitionController.getCompetitionStudents);

// Report Export
router.get('/competitions/export-report', facultyController.exportParticipationReport);
router.get('/competition/:id/export', facultyCompetitionController.exportCompetitionReport);


// V2 Sync Routes
router.post('/competition/:competitionId/sync', facultyController.syncCompetition);
router.get('/competition-sync-status', facultyController.getCompetitionSyncStatus); // New route if needed by frontend

// Verification Routes (Student Registration)
router.get('/pending-verifications', verificationController.getPendingVerifications);
router.post('/verify-registration', verificationController.verifyRegistration);

// Team Verification Routes
router.get('/pending-teams', teamVerificationController.getPendingTeamVerifications);
router.post('/verify-team', teamVerificationController.verifyTeam);

module.exports = router;
