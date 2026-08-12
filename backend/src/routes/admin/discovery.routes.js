const express = require('express');
const router = express.Router();
const controller = require('../../controllers/discovery/competitionDiscovery.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

router.post('/competition-discovery/sync', controller.triggerDiscoverySync);
router.get('/competition-candidates', controller.listCompetitionCandidates);
router.get('/competition-candidates/:id', controller.getCompetitionCandidate);
router.patch('/competition-candidates/:id', controller.updateCompetitionCandidate);
router.post('/competition-candidates/:id/approve', controller.approveCompetitionCandidate);
router.post('/competition-candidates/:id/reject', controller.rejectCompetitionCandidate);

module.exports = router;
