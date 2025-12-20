// File Name: student.routes.js
// Purpose: Routes for student features
// Written for beginner developers

const express = require('express');
const router = express.Router();
const competitionController = require('../../controllers/student/competition.controller');
const registrationController = require('../../controllers/student/registration.controller');
const checkRole = require('../../middleware/role.middleware');
//const authMiddleware = require('../middleware/authMiddleware');
//const roleMiddleware = require('../middleware/roleMiddleware');

// All routes here require the user to be a STUDENT
// This middleware checks the 'x-user-id' header and the database role
router.use(checkRole('STUDENT'));

router.get('/competitions', competitionController.getAllCompetitions);
router.post('/register', registrationController.registerForCompetition);

module.exports = router;
