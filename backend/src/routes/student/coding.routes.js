const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/role.middleware');
const controller = require('../../controllers/student/codingProfile.controller');

router.use(authMiddleware);
router.use(roleMiddleware('STUDENT'));

router.get('/coding-profiles', controller.getCodingProfiles);
router.put('/coding-profiles/leetcode', controller.updatePlatformProfile('LEETCODE'));
router.put('/coding-profiles/codechef', controller.updatePlatformProfile('CODECHEF'));
router.post('/coding-profiles/:id/sync', controller.triggerSync);

module.exports = router;
