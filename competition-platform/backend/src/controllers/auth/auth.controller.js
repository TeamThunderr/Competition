// File Name: auth.controller.js
// Purpose: specific logic for authentication routes

const supabase = require('../../config/supabaseClient');

const login = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        console.log('Login attempt for:', email);

        // 1. Check if user already exists
        const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('Database Select Error:', selectError);
        }

        if (existingUser) {
            console.log(`User found: ${existingUser.email} (${existingUser.role})`);
            return res.status(200).json({
                message: 'Login successful',
                user: existingUser,
                role: existingUser.role
            });
        } else {
            console.log('User not found in database. Login rejected.');
            return res.status(401).json({ error: 'Access Denied: User not found in database.' });
        }
    } catch (err) {
        console.error('Unexpected error in login:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    login
};
