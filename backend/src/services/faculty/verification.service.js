// File Name: verification.service.js
// Purpose: Handle Faculty verification of student screenshots
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

const verifyRegistration = async (facultyId, registrationId, status) => {
    // status must be 'APPROVED' or 'REJECTED'
    const isVerified = (status === 'APPROVED');

    // 1. Update Registration Table
    const { data, error } = await supabase
        .from('registrations')
        .update({
            verified: isVerified,
            verified_by: facultyId
        })
        .eq('id', registrationId)
        .select()
        .single();

    if (error) throw error;

    // 2. If Approved, Create a Competition Status Entry (Pending Shortlist)
    if (isVerified) {
        const { user_id, competition_id } = data;

        // Check if status entry exists
        const { data: existingStatus } = await supabase
            .from('competition_status')
            .select('*')
            .eq('user_id', user_id)
            .eq('competition_id', competition_id)
            .single();

        if (!existingStatus) {
            await supabase
                .from('competition_status')
                .insert([{
                    user_id: user_id,
                    competition_id: competition_id,
                    is_shortlisted: false,
                    is_winner: false
                }]);
        }
    }

    return data;
};

module.exports = {
    verifyRegistration
};
