// File Name: competition.service.js
// Purpose: Handle Database Logic for Competitions (Student View)
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Service function: Get all active competitions
// This checks Supabase and returns data
const getAllCompetitions = async () => {
    // Example Supabase call (commented out until DB is ready)
    // const { data, error } = await supabase.from('competitions').select('*');
    // if (error) throw error;
    // return data;
    return []; // Placeholder
};

module.exports = {
    getAllCompetitions
};
