// File Name: gmail.service.js
// Purpose: Mock service to scan Gmail for competition updates
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

/**
 * MOCK FUNCTION: Simulates scanning a student's Gmail inbox.
 * In a real app, this would use the Gmail API.
 * Here we will just look for "patterns" in a simulation.
 */
const scanInboxForStudent = async (userId, userEmail) => {
    console.log(`Scanning inbox for user: ${userEmail} (${userId})...`);

    // 1. In a real system, we would:
    //    - Authenticate with Gmail API (OAuth)
    //    - List messages with query "subject:registered OR subject:shortlisted"
    //    - Parse email bodies

    // 2. FOR THIS DEMO: We will assume we found a "Registration Confirmed" email
    //    We will look for competitions that accept 'AUTO_GMAIL' and see if we can "find" one.

    // logic: find any competition that the student is NOT registered for yet, 
    // and randomly "simulate" finding an email for it.

    return {
        success: true,
        message: "Scan complete",
        found: 0 // Default to 0 found for safety
    };
};

/**
 * Use this function to manually "trigger" a detected registration
 * This helps simulation without real Gmail.
 */
const simulateGmailDetection = async (userId, competitionId, status = 'PENDING') => {
    try {
        console.log(`Simulating Gmail detection for User ${userId}, Comp ${competitionId}`);

        // Check if already exists
        const { data: existing } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', userId)
            .eq('competition_id', competitionId)
            .single();

        if (existing) {
            console.log("Already registered.");
            return { success: false, message: "Already registered" };
        }

        // Insert Registration
        const { data, error } = await supabase
            .from('registrations')
            .insert([{
                user_id: userId,
                competition_id: competitionId,
                source: 'AUTO_GMAIL',
                verified: true, // Gmail is trusted source
                verified_by: null // System verified
            }])
            .select();

        if (error) throw error;

        return { success: true, message: "Registration detected via Gmail!", data };

    } catch (error) {
        console.error("Gmail Simulation Error:", error);
        return { success: false, message: error.message };
    }
};

module.exports = {
    scanInboxForStudent,
    simulateGmailDetection
};
