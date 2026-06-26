// File Name: auth.controller.js
// Purpose: Authentication logic — verifies Supabase JWT, returns user profile from DB

const supabase = require('../../config/supabaseClient');
const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Expects: Authorization: Bearer <supabase_access_token>
// Returns: { user, role }
//
// The Supabase access_token is a real JWT signed with SUPABASE_JWT_SECRET.
// We verify it here rather than trusting the email sent from the client.
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        // 1. Extract token from Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];

        // 2. Verify and decode the Supabase JWT
        let payload;
        try {
            payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
                algorithms: ['HS256'],
            });
        } catch (jwtErr) {
            if (jwtErr.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired. Please log in again.' });
            }
            return res.status(401).json({ error: 'Invalid token.' });
        }

        // 3. Extract email from the verified payload
        const userEmail = payload.email;
        if (!userEmail) {
            return res.status(401).json({ error: 'Token has no email claim.' });
        }

        // 4. Look up the user in our custom users table (case-insensitive)
        const { data: user, error: dbError } = await supabase
            .from('users')
            .select('*')
            .ilike('email', userEmail)
            .maybeSingle();

        if (dbError && dbError.code !== 'PGRST116') {
            console.error('[Auth] DB lookup error:', dbError);
            return res.status(500).json({ error: 'Database error during login.' });
        }

        if (!user) {
            return res.status(401).json({
                error: 'Access Denied: Your email is not registered in this system.',
            });
        }

        // 5. Return user profile and role
        return res.status(200).json({
            message: 'Login successful',
            user,
            role: user.role,
            token, // echo the same Supabase token back — frontend stores this
        });
    } catch (err) {
        console.error('[Auth] Unexpected error in login:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/save-token
// Saves the Google OAuth refresh token for Gmail integration
// ─────────────────────────────────────────────────────────────────────────────
const saveGoogleToken = async (req, res) => {
    try {
        const { email, refreshToken } = req.body;

        if (!email || !refreshToken) {
            // No new token to save (e.g. repeat login without new consent)
            return res.status(200).json({ message: 'No new token to save' });
        }

        const { data, error } = await supabase
            .from('users')
            .update({ google_refresh_token: refreshToken })
            .ilike('email', email)
            .select();

        if (error) {
            console.error('[Auth] Error saving token:', error.message);
            return res.status(500).json({ error: 'DB Update Failed: ' + error.message });
        }

        if (!data || data.length === 0) {
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
    saveGoogleToken,
};
