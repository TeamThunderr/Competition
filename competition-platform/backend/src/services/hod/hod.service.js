// File Name: hod.service.js
// Purpose: Handle HOD operations (OD Approval)
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

const approveODRequest = async (hodId, odRequestId, status) => {
    // status: 'APPROVED' or 'REJECTED'

    const { data, error } = await supabase
        .from('od_requests')
        .update({
            status: status,
            approved_by: hodId,
            approved_at: new Date()
        })
        .eq('id', odRequestId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    approveODRequest
};
