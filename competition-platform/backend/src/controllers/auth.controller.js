// File Name: auth.controller.js
// Purpose: Handle incoming requests for authentication
// Written for beginner developers

// Note: DB logic is in the SERVICE, not here.
const supabase = require('../config/supabaseClient'); // Just in case, but prefer service

// Controller to handle Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Logic will go here (call AuthService)
        res.status(200).json({ message: "Login successful (Placeholder)" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Controller to handle Signup
exports.signup = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        // Logic will go here (call AuthService)
        res.status(201).json({ message: "Signup successful (Placeholder)" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
