// File Name: od.service.js
// Purpose: Handle OD (On-Duty) Requests
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Function: Approve or Reject OD
const processODRequest = async (requestId, hodId, status) => {
    // status: 'APPROVED' or 'REJECTED'

    const { data, error } = await supabase
        .from('od_requests')
        .update({
            status: status,
            approved_by: hodId
        })
        .eq('id', requestId);

    if (error) throw error;
    return data;
};

// Function: Get all pending OD requests for the department
const getPendingODRequests = async (departmentId) => {
    // Join with users to filter by department
    return []; // Placeholder
};

module.exports = {
    processODRequest,
    getPendingODRequests
};
