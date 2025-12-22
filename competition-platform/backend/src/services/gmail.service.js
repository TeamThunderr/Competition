// File Name: gmail.service.js
// Purpose: Mock Service to scan Gmail for competition keywords
// Written for beginner developers

const supabase = require('../config/supabaseClient');

// Keywords to look for
const KEYWORDS = {
    REGISTERED: ['registration confirmed', 'successfully registered', 'ticket confirmed'],
    SHORTLISTED: ['shortlisted', 'round 2', 'selected for next round']
};

/**
 * MOCK Function: Simulates scanning a user's Gmail
 * In a real app, this would use the Gmail API
 */
const scanInboxForUser = async (userId, userEmail) => {
    console.log(`Scanning inbox for ${userEmail}...`);

    // MOCK DATA: Simulate finding an email
    // In production, fetch emails from Gmail API here
    const foundEmails = [
        {
            subject: "Registration Confirmed: Hackathon 2024",
            body: "Hi Student, you have successfully registered for Hackathon 2024."
        }
    ];

    const detectedRegistrations = [];

    for (const email of foundEmails) {
        // Simple text matching
        const isRegistered = KEYWORDS.REGISTERED.some(k =>
            email.subject.toLowerCase().includes(k) || email.body.toLowerCase().includes(k)
        );

        if (isRegistered) {
            // Find matching competition in DB (fuzzy match title?)
            // For this mock, let's assume we found a specific competition ID
            // detectedRegistrations.push({ ... })
            console.log("Detected Registration email!");
        }
    }

    return detectedRegistrations;
};

module.exports = {
    scanInboxForUser
};
