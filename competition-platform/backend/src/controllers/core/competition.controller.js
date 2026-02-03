// File Name: competition.controller.js
// Purpose: Logic for managing competitions
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Get all competitions (Public)
// UPDATED: Removed participation table reference (table dropped)
const { sendResponse, sendError } = require('../../utils/responseHelper');

// Get all competitions (Public)
// UPDATED: Removed participation table reference (table dropped)
const getAllCompetitions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('competitions')
            .select('*, registrations(count)')
            .order('registration_deadline', { ascending: true });

        if (error) {
            console.error('[CompetitionController] DB Error:', error);
            return sendError(res, 500, error.message);
        }

        // Use registrations count only (participation table was dropped)
        const enrichedData = data.map(comp => {
            const totalCount = comp.registrations && comp.registrations[0] ? comp.registrations[0].count : 0;

            return {
                ...comp,
                registrations: [{ count: totalCount }]
            };
        });

        sendResponse(res, 200, enrichedData, 'Fetched all competitions');
    } catch (err) {
        console.error('[CompetitionController] Internal Error:', err);
        sendError(res, 500, err.message);
    }
};

// Create a new competition (Public Mode: Any user with x-user-id can create)
const createCompetition = async (req, res) => {
    try {
        const {
            title,
            description,
            platform,
            organization, // Mapping frontend 'organizer' to this? No, schema says 'organizer'
            organizer,
            link, // Schema says external_link
            external_link,
            deadline, // Schema says registration_deadline
            registration_deadline,
            event_date,
            mode,
            team_allowed,
            min_team_size,
            max_team_size,
            venue, // Added venue
            departments = ['All'] // Default to All if missing
        } = req.body;
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
                    organizer: organizer || organization,
                    external_link: external_link || link,
                    registration_deadline: (registration_deadline || deadline) || null,
                    event_date: event_date || null,
                    mode,
                    team_allowed,
                    min_team_size,
                    max_team_size,
                    venue,
                    departments, // Store departments
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
