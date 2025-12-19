// File Name: competition.controller.js (Student)
// Purpose: Handle student competition requests
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

const getAllCompetitions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching competitions:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { getAllCompetitions };
