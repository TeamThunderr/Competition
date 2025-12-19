// File Name: competition.routes.js
// Purpose: Routes for competition operations
// Written for beginner developers

const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competition.controller');
const checkRole = require('../middleware/role.middleware');

// GET /api/competitions - List all (Open to verified users)
// We might want to ensure they are at least logged in, but 'Public' view is also common.
// Let's assume public for now, or add checkRole(['STUDENT', 'FACULTY', 'HOD', 'ADMIN']) if strictly private.
router.get('/', competitionController.getAllCompetitions);

// POST /api/competitions - Create new (Admin Only)
router.post('/', checkRole('ADMIN'), competitionController.createCompetition);

module.exports = router;
