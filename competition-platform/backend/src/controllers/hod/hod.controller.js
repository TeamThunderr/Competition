// File Name: hod.controller.js
// Purpose: Handle HOD requests
// Written for beginner developers

const { sendResponse } = require('../../utils/responseHelper');

const getDepartmentStats = async (req, res) => {
    // TODO: Fetch from service
    sendResponse(res, 200, { students: 120, active: 15 }, 'Fetched department stats');
};

module.exports = { getDepartmentStats };
