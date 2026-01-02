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

const saveGoogleToken = async (req, res) => {
    try {
        const { email, refreshToken } = req.body;
        console.log(`[Auth] Saving Google Token for: ${email}, Token Length: ${refreshToken ? refreshToken.length : 'null'}`);

        if (!email || !refreshToken) {
            // It's possible refreshToken is missing if user already logged in previously and consent wasn't prompted again.
            // But we should only call this if we HAVE a token.
            return res.status(200).json({ message: 'No new token to save' });
        }

        const { error } = await supabase
            .from('users')
            .update({ google_refresh_token: refreshToken })
            .eq('email', email);

        if (error) {
            console.error('[Auth] Error saving token:', error.message);
            return res.status(500).json({ error: 'DB Update Failed' });
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
