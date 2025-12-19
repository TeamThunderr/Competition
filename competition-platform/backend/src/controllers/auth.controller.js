// File Name: auth.controller.js
// Purpose: specific logic for authentication routes

const supabase = require('../config/supabaseClient');

const syncUser = async (req, res) => {
    try {
        const { uid, email, full_name, avatar_url, role } = req.body;

        if (!uid || !email) {
            return res.status(400).json({ error: 'UID and Email are required' });
        }

        // Check for existing user to preserve role (don't downgrade Admin to Student on login)
        const { data: existingUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', uid)
            .single();

        // If user exists, keep their role; otherwise default to STUDENT
        let assignedRole = existingUser ? existingUser.role : (role || 'STUDENT');

        // Ensure role is uppercase to match Database ENUM
        assignedRole = assignedRole.toUpperCase();

        // Example: hardcode admin for testing
        // if (email === 'admin@citchennai.net') assignedRole = 'ADMIN';

        const { data, error } = await supabase
            .from('users')
            .upsert({
                id: uid,
                email: email,
                full_name: full_name,
                avatar_url: avatar_url,
                role: assignedRole
            }, { onConflict: 'id' })
            .select();

        if (error) {
            console.error('Error syncing user:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: 'User synced successfully', user: data });
    } catch (err) {
        console.error('Unexpected error in syncUser:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const login = async (req, res) => {
    res.status(200).json({ message: 'Login handled by Frontend via Supabase Auth' });
}

const signup = async (req, res) => {
    res.status(200).json({ message: 'Signup handled by Frontend via Supabase Auth' });
}

module.exports = {
    syncUser,
    login,
    signup
};
