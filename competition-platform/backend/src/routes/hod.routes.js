// File Name: hod.routes.js
// Purpose: Define API routes for HOD operations
// Written for beginner developers

const express = require('express');
const router = express.Router();
const roleMiddleware = require('../../middleware/roleMiddleware');
const hodController = require('../../controllers/hod/hod.controller');

// Middleware: All routes here require HOD role
router.use(roleMiddleware(['HOD']));

// Approve OD
router.post('/od/approve', hodController.processODRequest);

module.exports = router;
