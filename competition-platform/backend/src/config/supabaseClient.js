// File Name: supabaseClient.js
// Purpose: Connect to Supabase database
// Written for beginner developers

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Get these from your Supabase dashboard
const supabaseUrl = process.env.SUPABASE_URL;
// Use Service Role Key to bypass RLS for Backend API
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
