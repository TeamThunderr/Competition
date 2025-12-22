// File Name: auth.routes.js
// Purpose: Define API routes for Authentication
// Written for beginner developers

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Route: /api/auth/login
// Description: Handle user login
router.post('/login', authController.login);

// Route: /api/auth/signup
// Description: Handle user registration
router.post('/signup', authController.signup);

module.exports = router;
