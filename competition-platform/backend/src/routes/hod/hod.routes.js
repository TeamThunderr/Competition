// File Name: hod.routes.js
// Purpose: Routes for HOD features
// Written for beginner developers

const express = require('express');
const router = express.Router();
const hodController = require('../../controllers/hod/hod.controller');
const hodCompetitionController = require('../../controllers/hod/competition.controller');
const odController = require('../../controllers/hod/od.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const { manageOdSchema } = require('../../validation/schemas/hod.schema');

// 1. Auth & Role Guards
console.log("Loading HOD Routes...");
console.log("odController keys:", Object.keys(odController));

router.use((req, res, next) => {
    console.log(`[HOD Router] Incoming request: ${req.method} ${req.path}`);
    next();
});

// 1. Auth & Role Guards
router.use(authMiddleware);
router.use(roleMiddleware('HOD'));

router.get('/stats', hodController.getDepartmentStats);
router.get('/users', hodController.getDepartmentUsers);
router.get('/analytics', hodController.getDepartmentAnalytics);
router.get('/dashboard-analysis', hodController.getDashboardAnalysis);
router.get('/stats/export-winners', hodController.exportWinnersCsv);
router.get('/students/:studentId', hodController.getStudentDetails);

// Faculty Directory
router.get('/faculty', hodController.getDepartmentFaculty);

// Competition View (Read Only)
router.get('/competitions', hodCompetitionController.getAllCompetitions);
router.get('/competition/:id', hodCompetitionController.getCompetitionDetails);
router.get('/competition/:id/stats', hodCompetitionController.getCompetitionStats);

// OD Management Routes
router.get('/pending-od', odController.getPendingODRequests);
router.get('/od-request/:id', odController.getODRequestDetail);
router.post('/manage-od', validate(manageOdSchema), odController.manageODRequest);

module.exports = router;
