// File Name: hod.routes.js
// Purpose: Routes for HOD features
// Written for beginner developers

const express = require('express');
const router = express.Router();
const hodController = require('../../controllers/hod/hod.controller');
const checkRole = require('../../middleware/role.middleware');

//router.use(authMiddleware);
//router.use(roleMiddleware('hod'));

router.get('/stats', hodController.getDepartmentStats);

module.exports = router;
