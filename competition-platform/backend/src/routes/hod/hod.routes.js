// File Name: hod.routes.js
// Purpose: Routes for HOD features
// Written for beginner developers

const express = require('express');
const router = express.Router();
const hodController = require('../../controllers/hod/hod.controller');
const odController = require('../../controllers/hod/od.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/role.middleware');

// 1. Auth & Role Guards
router.use(authMiddleware);
router.use(roleMiddleware('HOD'));

router.get('/stats', hodController.getDepartmentStats);

// OD Management Routes
router.get('/pending-od', odController.getPendingODRequests);
router.post('/manage-od', odController.manageODRequest);

module.exports = router;
