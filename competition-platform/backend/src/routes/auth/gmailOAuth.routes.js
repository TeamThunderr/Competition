const express = require('express');
const router = express.Router();
const gmailOAuthController = require('../../controllers/auth/gmailOAuth.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// 1. Get Auth URL (Requires student to be logged in to pass userId in state)
router.get('/url', authMiddleware, gmailOAuthController.getAuthUrl);

// 2. Handle Google Callback (NO auth middleware - called by Google)
router.get('/callback', gmailOAuthController.handleOAuthCallback);

// 3. Revoke Access (Requires student to be logged in)
router.delete('/revoke', authMiddleware, gmailOAuthController.revokeGmailAccess);

module.exports = router;
