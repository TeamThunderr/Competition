// File Name: env.js
// Purpose: Centralized environment variables
// Written for beginner developers

require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5000,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
};

