// File Name: auth.routes.js
// Purpose: Define authentication routes
// Written for beginner developers

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');


router.post('/sync', authController.syncUser);

module.exports = router;
