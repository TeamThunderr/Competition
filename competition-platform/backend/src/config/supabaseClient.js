// File Name: supabaseClient.js
// Purpose: Connect the backend to Supabase (Admin access)
// Written in beginner-friendly style

// Import the Supabase client creator
const { createClient } = require('@supabase/supabase-js');

// Import environment configuration
const env = require('./env');

// Create the Supabase client
// We use the Service Role Key for admin access (Backend only)
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Export the client for use in controllers and services
module.exports = supabase;
