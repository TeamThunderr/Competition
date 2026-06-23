// File Name: od.service.js
// Purpose: Handle OD (On-Duty) request logic
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

/**
 * Request OD for a competition
 * Rule: Can only request if 'is_shortlisted' is TRUE in competition_status
 */
const requestOD = async (userId, competitionId, reason) => {
    // 1. Check if Shortlisted
    const { data: status, error: statusError } = await supabase
        .from('competition_status')
        .select('is_shortlisted')
        .eq('user_id', userId)
        .eq('competition_id', competitionId)
        .single();

    if (statusError || !status || !status.is_shortlisted) {
        throw new Error("You can only request OD if you are Shortlisted.");
    }

    // 2. Check if already requested
    const { data: existing } = await supabase
        .from('od_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('competition_id', competitionId)
        .single();

    if (existing) {
        throw new Error("OD Request already pending or processed.");
    }

    // 3. Create Request
    const { data, error } = await supabase
        .from('od_requests')
        .insert([
            {
                user_id: userId,
                competition_id: competitionId,
                reason: reason,
                status: 'PENDING'
            }
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    requestOD
};
