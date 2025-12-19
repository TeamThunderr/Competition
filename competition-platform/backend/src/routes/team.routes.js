// File Name: team.routes.js
// Purpose: Routes for team management
// Written for beginner developers

const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const checkRole = require('../middleware/role.middleware');

// All these routes require a logged-in user (usually STUDENT)
// passing 'STUDENT' allows students, but technically Admins might want access too.
// For now, let's allow 'STUDENT' as the primary actor.

router.post('/create', checkRole('STUDENT'), teamController.createTeam);
router.post('/invite', checkRole('STUDENT'), teamController.inviteMember);
router.post('/accept', checkRole('STUDENT'), teamController.acceptInvite);

module.exports = router;
