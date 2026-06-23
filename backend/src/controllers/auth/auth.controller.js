// File Name: auth.controller.js
// Purpose: specific logic for authentication routes

const supabase = require('../../config/supabaseClient');

const login = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const cleanedEmail = email.trim();

        // 1. Check if user already exists (Case Insensitive)
        const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('*')
            .ilike('email', cleanedEmail) // Robust matching
            .maybeSingle();

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('Database Select Error:', selectError);
            return res.status(500).json({ error: 'Database check failed: ' + selectError.message });
        }

        if (existingUser) {
            return res.status(200).json({
                message: 'Login successful',
                user: existingUser,
                role: existingUser.role
            });
        } else {
            return res.status(401).json({ error: 'Access Denied: User not found in database.' });
        }
    } catch (err) {
        console.error('Unexpected error in login:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const saveGoogleToken = async (req, res) => {
    try {
        const { email, refreshToken } = req.body;

        if (!email || !refreshToken) {
            // It's possible refreshToken is missing if user already logged in previously and consent wasn't prompted again.
            // But we should only call this if we HAVE a token.
            return res.status(200).json({ message: 'No new token to save' });
        }

        const { data, error } = await supabase
            .from('users')
            .update({ google_refresh_token: refreshToken })
            .eq('email', email)
            .select();

        if (error) {
            console.error('[Auth] Error saving token:', error.message);
            // If RLS blocks it or generic error, returned 500 is fine, but let's be cleaner.
            // If user doesn't exist, this might not error but return empty data in some configs, 
            // but if it errors (e.g. RLS), we should fail gracefully.
            return res.status(500).json({ error: 'DB Update Failed: ' + error.message });
        }

        if (!data || data.length === 0) {
            // This is technically not a server error, just a "user not found" scenario.
            // We can return 200 OK to frontend to ignore it, or 404.
            // Frontend treats any error as failure. Let's return 404.
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ message: 'Token saved successfully' });
    } catch (err) {
        console.error('[Auth] Error in saveGoogleToken:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    login,
    saveGoogleToken
};
