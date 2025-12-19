// File Name: faculty.controller.js
// Purpose: Handle faculty requests
// Written for beginner developers

const { sendResponse } = require('../../utils/responseHelper');

const getMyStudents = async (req, res) => {
    // TODO: Fetch from service
    sendResponse(res, 200, [], 'Fetched student list');
};

module.exports = { getMyStudents };
