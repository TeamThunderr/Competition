// File Name: registration.controller.js
// Purpose: Handle student registration attempts (Gmail check or Proof upload)
// Written for beginner developers

const supabase = require('../../config/supabaseClient');
const checkRegistrationStatus = async (req, res) => {
    try {
        console.log('[Registration] Request received:', req.body, 'User:', req.userId);
        const { competition_id } = req.body;
        const student_id = req.userId;

        if (!competition_id) return res.status(400).json({ error: 'Competition ID is required' });

        // In a real app, this might trigger a specific scan or just check existing records
        // For now, we rely on the auto-scan that happens on login.

        // Attempt to find existing registration
        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .single();

        if (data) {
            return res.status(200).json({ status: 'REGISTERED', source: data.source, verified: data.verified });
        } else {
            return res.status(200).json({ status: 'NOT_FOUND', message: 'No registration email found. Please upload proof.' });
        }

    } catch (err) {
        console.error('Check Status Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 2. Upload Screenshot Proof (Manual)
const uploadProof = async (req, res) => {
    try {
        const { competition_id, proof_url } = req.body;
        const student_id = req.userId;

        if (!competition_id || !proof_url) {
            return res.status(400).json({ error: 'Competition ID and Proof URL are required' });
        }

        // Check if already exists
        const { data: existing } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Registration entry already exists.' });
        }

        // Create new registration entry
        const { data, error } = await supabase
            .from('registrations')
            .insert([{
                user_id: student_id,
                competition_id: competition_id,
                source: 'MANUAL_SCREENSHOT',
                proof_url: proof_url,
                verified: false, // Needs faculty approval
                verified_by: null
            }])
            .select();

        if (error) throw error;

        res.status(201).json({ message: 'Proof uploaded. Waiting for Faculty verification.', data: data[0] });

    } catch (err) {
        console.error('Upload Proof Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    checkRegistrationStatus,
    uploadProof
};
