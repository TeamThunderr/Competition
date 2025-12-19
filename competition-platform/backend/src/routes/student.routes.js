// File Name: student.routes.js
// Purpose: Routes for student features
// Written for beginner developers

const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/student/competition.controller');
//const authMiddleware = require('../middleware/authMiddleware');
//const roleMiddleware = require('../middleware/roleMiddleware');

// Protect all routes
//router.use(authMiddleware);
//router.use(roleMiddleware('student'));

router.get('/competitions', competitionController.getAllCompetitions);

module.exports = router;
