// File Name: auth.routes.js
// Purpose: Define authentication routes

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/auth.controller');
const gmailOAuthController = require('../../controllers/auth/gmailOAuth.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/save-token — saves provider_refresh_token from Supabase OAuth
router.post('/save-token', authController.saveGoogleToken);

// GET /api/auth/gmail/connect — returns Google consent URL (must be logged in)
router.get('/gmail/connect', authMiddleware, (req, res) => {
    req.userId = req.user.id; // gmailOAuth controller expects req.userId
    gmailOAuthController.getAuthUrl(req, res);
});

// GET /api/auth/gmail/callback — public redirect URI registered in Google Cloud Console
// Google redirects here after user grants consent
router.get('/gmail/callback', gmailOAuthController.handleOAuthCallback);

module.exports = router;
