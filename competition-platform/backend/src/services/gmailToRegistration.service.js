// services/gmailToRegistration.service.js

const supabase = require('../config/supabaseClient');

async function updateRegistrationFromGmail({
    userId,
    competitionId,
    detectedStatus
}) {
    // Default mapping
    const statusMap = {
        REGISTERED: 'REGISTERED',
        QUALIFIED: 'QUALIFIED',
        WON: 'WON',
        REJECTED: 'REJECTED'
    };

    const status = statusMap[detectedStatus] || 'PENDING';

    console.log(`[GmailToReg] Updating ${userId} for comp ${competitionId} with status ${status}`);

    const { data, error } = await supabase
        .from('registrations')
        .upsert({
            user_id: userId,
            competition_id: competitionId,
            source: 'GMAIL',
            status,
            verified: true
        }, {
            onConflict: 'user_id,competition_id'
        });

    if (error) {
        console.error('Registration update failed:', error);
        throw error;
    }

    return data;
}

module.exports = { updateRegistrationFromGmail };
