// File Name: competition.controller.js
// Purpose: Logic for managing competitions
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Get all competitions (Public)
const getAllCompetitions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('competitions')
            .select('*, registrations(count), participation(count)')
            .order('registration_deadline', { ascending: true });


        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Aggregate counts (Manual Registrations + Auto-Synced Participation)
        const enrichedData = data.map(comp => {
            const manualCount = comp.registrations && comp.registrations[0] ? comp.registrations[0].count : 0;
            const autoCount = comp.participation && comp.participation[0] ? comp.participation[0].count : 0;
            const totalCount = manualCount + autoCount;

            // Hack: Override registrations count for frontend compatibility
            // The frontend looks at comp.registrations[0].count
            return {
                ...comp,
                registrations: [{ count: totalCount }], // Mocked structure
                manual_count: manualCount,
                auto_count: autoCount
            };
        });

        res.status(200).json(enrichedData);
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

// Get single competition by ID
const getCompetitionById = async (req, res) => {
    try {
        const { id } = req.params;

        // Simple regex check for UUID (approximate)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({ error: 'Invalid Competition ID Format' });
        }

        const { data, error } = await supabase
            .from('competitions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('[Competition Core] Supabase Error:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'Competition not found' });
        }

        res.status(200).json(data);
    } catch (err) {
        console.error('[Competition Core] Internal Error:', err);
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
    }
};

module.exports = {
    getAllCompetitions,
    createCompetition,
    getCompetitionById
};
