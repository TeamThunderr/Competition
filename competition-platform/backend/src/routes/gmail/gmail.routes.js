const express = require('express');
const router = express.Router();
const gmailController = require('../../controllers/gmail/gmail.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.post('/scan', authMiddleware, gmailController.scanInbox);

module.exports = router;
