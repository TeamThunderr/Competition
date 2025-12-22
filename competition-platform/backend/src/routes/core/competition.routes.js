// File Name: competition.routes.js
// Purpose: Routes for competition operations
// Written for beginner developers

const express = require('express');
const router = express.Router();
const competitionController = require('../../controllers/core/competition.controller');
// const checkRole = require('../middleware/role.middleware'); // Removed for public access

// GET /api/competitions - List all
router.get('/', competitionController.getAllCompetitions);

// POST /api/competitions - Create new (Simulating Admin via header)
router.post('/', competitionController.createCompetition);

module.exports = router;
