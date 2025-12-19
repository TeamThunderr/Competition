// File Name: competition.controller.js (Student)
// Purpose: Handle student competition requests
// Written for beginner developers

const { sendResponse } = require('../../utils/responseHelper');

const getAllCompetitions = async (req, res) => {
    // TODO: Fetch from service
    sendResponse(res, 200, [], 'Fetched all competitions');
};

module.exports = { getAllCompetitions };
