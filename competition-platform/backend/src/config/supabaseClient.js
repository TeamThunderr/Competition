// File Name: supabaseClient.js
// Purpose: Connect the backend to Supabase (Admin access)
// Written in beginner-friendly style

// Import the Supabase client creator
const { createClient } = require('@supabase/supabase-js');

// Import environment variables
// Note: We use process.env in Node.js (Backend)
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// IMPORTANT: The Service Role Key allows the backend to bypass Row Level Security
// This means the backend has full access to the database (Admin powers)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Export the client for use in controllers and services
module.exports = supabase;
