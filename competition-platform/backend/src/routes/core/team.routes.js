// File Name: team.routes.js
// Purpose: Routes for team management
// Written for beginner developers

const express = require('express');
const router = express.Router();
const teamController = require('../../controllers/core/team.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Apply auth middleware to all team routes
router.use(authMiddleware);

// All routes now have req.userId set from auth middleware
router.post('/create', teamController.createTeam);
router.post('/invite', teamController.inviteMember);
router.post('/accept', teamController.acceptInvite);
router.post('/upload-proof', teamController.uploadProof);
router.post('/submit-verification', teamController.submitVerification);

module.exports = router;
