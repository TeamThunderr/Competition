// File Name: admin.routes.js
// Purpose: Routes for admin features
// Written for beginner developers

const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/admin/competition.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.post('/competitions', competitionController.createCompetition);

module.exports = router;
