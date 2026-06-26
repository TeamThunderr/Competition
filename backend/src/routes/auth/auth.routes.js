// File Name: auth.routes.js
// Purpose: Define authentication routes

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/auth.controller');
const validate = require('../../middleware/validate.middleware');
const { loginSchema } = require('../../validation/schemas/auth.schema');

// POST /api/auth/login
// Verifies Supabase JWT from Authorization header, returns user profile + role
router.post('/login', authController.login);

// POST /api/auth/save-token
// Saves Google OAuth refresh token for Gmail integration
router.post('/save-token', authController.saveGoogleToken);

module.exports = router;
