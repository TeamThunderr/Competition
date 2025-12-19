// File Name: team.routes.js
// Purpose: Routes for team management
// Written for beginner developers

const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
// const checkRole = require('../middleware/role.middleware'); // Removed for public access

// All routes rely on x-user-id header
router.post('/create', teamController.createTeam);
router.post('/invite', teamController.inviteMember);
router.post('/accept', teamController.acceptInvite);

module.exports = router;
