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

// 1. Auth & Role Guards
router.use(authMiddleware);
router.use(roleMiddleware('HOD'));

router.get('/stats', hodController.getDepartmentStats);
router.get('/users', hodController.getDepartmentUsers);

// Competition View (Read Only)
router.get('/competitions', hodCompetitionController.getAllCompetitions);
router.get('/competition/:id', hodCompetitionController.getCompetitionDetails);
router.get('/competition/:id/stats', hodCompetitionController.getCompetitionStats);

// OD Management Routes
router.get('/pending-od', odController.getPendingODRequests);
router.post('/manage-od', odController.manageODRequest);

module.exports = router;
