// File Name: registration.service.js
// Purpose: Handle student registration logic (Screenshot upload)
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Function: Manually upload proof (screenshot)
const uploadScreenshot = async (userId, competitionId, proofUrl) => {
    // Check if already registered
    const { data: existing } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', userId)
        .eq('competition_id', competitionId)
        .single();

    if (existing) {
        throw new Error("Already registered for this competition");
    }

    // Insert new registration
    const { data, error } = await supabase
        .from('registrations')
        .insert([
            {
                user_id: userId,
                competition_id: competitionId,
                source: 'MANUAL_SCREENSHOT',
                proof_url: proofUrl,
                verified: false // Needs Faculty verification
            }
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
};

module.exports = {
    uploadScreenshot
};
