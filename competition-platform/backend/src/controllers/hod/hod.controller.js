// File Name: hod.controller.js
// Purpose: Handle HOD requests
// Written for beginner developers

const { sendResponse } = require('../../utils/responseHelper');

const statsService = require('../../services/admin/stats.service');

const getDepartmentStats = async (req, res) => {
    try {
        const hodDeptId = req.user.department_id;
        console.log(`[HodController] Fetching stats for Dept: ${hodDeptId}`);

        // Reuse the admin service (it gets all, we just filter)
        // In a strictly optimized app, we'd make a specific service method.
        const allStats = await statsService.getDepartmentStats();

        const myDeptStats = allStats.find(d => d.department_id === hodDeptId) || {
            department_name: 'My Department',
            total_registrations: 0,
            verified_registrations: 0,
            sections: []
        };

        sendResponse(res, 200, myDeptStats, 'Fetched department stats');
    } catch (err) {
        console.error('[HodController] Error:', err);
        sendResponse(res, 500, null, 'Internal Server Error');
    }
};

module.exports = { getDepartmentStats };
