// File Name: student.routes.js
// Purpose: Define API routes for Student operations
// Written for beginner developers

const express = require('express');
const router = express.Router();
const roleMiddleware = require('../../middleware/roleMiddleware');

const registrationController = require('../../controllers/student/registration.controller');
const odController = require('../../controllers/student/od.controller');
const competitionController = require('../../controllers/student/competition.controller');

// Middleware: All routes here require STUDENT role
// req.user must be populated by authMiddleware before this
router.use(roleMiddleware(['STUDENT']));

// Competitions
router.get('/competitions', competitionController.getCompetitions);

// Registration (Manual Screenshot)
router.post('/register/manual', registrationController.uploadManualProof);

// OD Requests
router.post('/od/request', odController.createODRequest);

module.exports = router;
