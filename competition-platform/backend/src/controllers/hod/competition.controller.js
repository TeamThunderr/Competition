// File Name: competition.controller.js (HOD)
// Purpose: Handle HOD competition view requests
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

const getAllCompetitions = async (req, res) => {
    try {
        // Fetch competitions sorted by deadline
        // Does NOT fetch registration status as HODs don't register
        const { data: competitions, error } = await supabase
            .from('competitions')
            .select('*')
            .order('registration_deadline', { ascending: true });

        if (error) throw error;

        res.status(200).json(competitions);
    } catch (err) {
        console.error('Error fetching competitions (HOD):', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getCompetitionDetails = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching competition details:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getAllCompetitions,
    getCompetitionDetails
};
