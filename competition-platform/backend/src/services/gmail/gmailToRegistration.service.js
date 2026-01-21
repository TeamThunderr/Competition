// services/gmailToRegistration.service.js

const supabase = require('../../config/supabaseClient');

/**
 * Updates or Inserts into the 'participation' table based on Gmail detection.
 * 
 * @param {Object} params
 * @param {string} params.userId - The user's ID
 * @param {string} params.competitionId - The competition's ID
 * @param {string} params.detectedStatus - 'REGISTERED' | 'PENDING' | 'REJECTED' etc.
 * @param {string} [params.gmailMessageId] - ID of the email
 * @param {number} [params.confidenceScore] - Score from Gmail Intelligence Engine
 */
async function updateRegistrationFromGmail({
    userId,
    competitionId,
    detectedStatus,
    gmailMessageId,
    confidenceScore
}) {
    // Default mapping for 'participation' status enum
    // Assuming Enum: 'REGISTERED', 'NOT_REGISTERED', 'QUALIFIED', 'WON', 'PARTICIPATED'
    const statusMap = {
        REGISTERED: 'REGISTERED',
        QUALIFIED: 'REGISTERED', // Map qualified to registered if no better state exists, or assume qualification implies registration
        WON: 'WON',
        REJECTED: 'NOT_REGISTERED',
        PENDING: 'NOT_REGISTERED' // 'PENDING' isn't usually valid for participation unless specified
    };

    // If status is 'QUALIFIED', we might want to flag it?
    // For now, let's map strictly. 
    // If the schema supports 'QUALIFIED', use it. The user provided schema has 'NOT_REGISTERED' default.
    // Let's assume standard values.

    const status = statusMap[detectedStatus] || 'NOT_REGISTERED';

    console.log(`[GmailToParticipation] Updating ${userId} for comp ${competitionId} with status ${status}`);

    const { data, error } = await supabase
        .from('participation')
        .upsert({
            student_id: userId,
            competition_id: competitionId,
            status: status,
            verification_source: 'GMAIL',
            verified_by: null, // Auto-verified implies no human verified_by yet, or maybe a system bot ID?
            gmail_message_id: gmailMessageId || null,
            confidence_score: confidenceScore || 0,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'student_id,competition_id'
        });

    if (error) {
        console.error('Participation update failed:', error);
        throw error;
    }

    return data;
}

module.exports = { updateRegistrationFromGmail };
