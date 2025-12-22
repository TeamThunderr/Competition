// File Name: faculty.controller.js
// Purpose: Handle faculty requests
// Written for beginner developers

const { sendResponse } = require('../../utils/responseHelper');

const statsService = require('../../services/admin/stats.service');

const getMyStudents = async (req, res) => {
    // TODO: Fetch from service
    sendResponse(res, 200, [], 'Fetched student list');
};

const getStats = async (req, res) => {
    try {
        const deptId = req.user.department_id;
        const allStats = await statsService.getDepartmentStats();

        const myStats = allStats.find(d => d.department_id === deptId) || {
            department_name: 'My Department',
            total_registrations: 0,
            verified_registrations: 0,
            sections: []
        };

        sendResponse(res, 200, myStats, 'Fetched faculty stats');
    } catch (err) {
        console.error('[FacultyController] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

module.exports = { getMyStudents, getStats };
