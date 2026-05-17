// File Name: auth.routes.js
// Purpose: Define authentication routes
// Written for beginner developers

const express = require('express');
const router = express.Router();
console.log("Auth Routes Loaded"); // Debug Log
router.use((req, res, next) => {
    console.log('Auth Router Hit:', req.method, req.path);
    next();
});
const authController = require('../../controllers/auth/auth.controller');


// Route: POST /api/auth/login
// Desc:  Login via email (Development/Insecure)
router.post('/login', authController.login);
router.post('/save-token', authController.saveGoogleToken);

module.exports = router;
