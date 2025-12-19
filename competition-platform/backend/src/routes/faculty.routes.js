// File Name: faculty.routes.js
// Purpose: Routes for faculty features
// Written for beginner developers

const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty/faculty.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('faculty'));

router.get('/students', facultyController.getMyStudents);

module.exports = router;
