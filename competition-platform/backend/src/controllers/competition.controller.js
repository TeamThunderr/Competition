// File Name: competition.controller.js
// Purpose: Logic for managing competitions
// Written for beginner developers

const supabase = require('../config/supabaseClient');

// Get all competitions (Public)
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

// Create a new competition (Public Mode: Any user with x-user-id can create)
const createCompetition = async (req, res) => {
    try {
        const { title, description, platform, team_allowed, min_team_size, max_team_size } = req.body;
        const created_by = req.userId; // Retrieved from authMiddleware (x-user-id header)

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const { data, error } = await supabase
            .from('competitions')
            .insert([
                {
                    title,
                    description,
                    platform,
                    team_allowed,
                    min_team_size,
                    max_team_size,
                    created_by
                }
            ])
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({ message: 'Competition created successfully', competition: data[0] });
    } catch (err) {
        console.error('Error creating competition:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getAllCompetitions,
    createCompetition
};
