// File Name: competition.controller.js (Admin)
// Purpose: Handle admin competition management
// Written for beginner developers

const { sendResponse } = require('../../utils/responseHelper');

const createCompetition = async (req, res) => {
    // TODO: Call service
    sendResponse(res, 201, { id: 1, ...req.body }, 'Competition created');
};

module.exports = { createCompetition };
