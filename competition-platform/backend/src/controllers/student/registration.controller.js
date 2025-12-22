// File Name: registration.controller.js
// Purpose: Handle student registrations for competitions
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

const registerForCompetition = async (req, res) => {
    try {
        console.log('[Registration] Request received:', req.body, 'User:', req.userId);
        const { competition_id } = req.body;
        const student_id = req.userId; // Provided by role.middleware.js

        if (!competition_id) {
            console.warn('[Registration] Missing competition_id');
            return res.status(400).json({ error: 'Competition ID is required' });
        }

        // 1. Check if already registered
        const { data: existing, error: fetchError } = await supabase
            .from('registrations')
            .select('id')
            .eq('student_id', student_id)
            .eq('competition_id', competition_id)
            .single();

        // PGRST116 code from Supabase means "JSON object requested, multiple (or no) rows returned". 
        // In .single(), it means no rows found, which is what we want.
        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[Registration] Error checking existing:', fetchError);
            return res.status(500).json({ error: fetchError.message });
        }

        if (existing) {
            console.log('[Registration] Already registered:', existing);
            return res.status(400).json({ message: 'Already registered' });
        }

        // 2. Register logic
        const { data, error } = await supabase
            .from('registrations')
            .insert([{
                student_id: student_id,
                competition_id: competition_id
            }])
            .select();

        if (error) {
            console.error('[Registration] Insert Error:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log('[Registration] Success:', data[0]);
        res.status(200).json({ message: 'Registered successfully', registration: data[0] });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    registerForCompetition
};
