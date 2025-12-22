// File Name: health.routes.js
// Purpose: Check if server is running
// Written for beginner developers

const express = require('express');
const router = express.Router();

// What this function does: Returns a simple OK message
router.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

module.exports = router;
