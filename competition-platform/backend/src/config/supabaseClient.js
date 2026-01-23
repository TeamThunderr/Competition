// File Name: supabaseClient.js
// Purpose: Connect to Supabase database
// Written for beginner developers

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Get these from your Supabase dashboard
const supabaseUrl = process.env.SUPABASE_URL;
// Use Service Role Key to bypass RLS for Backend API
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

const supabaseKey = serviceKey || anonKey;

console.log('[SupabaseConfig] Initializing Client...');
console.log(`[SupabaseConfig] Using Service Key? ${!!serviceKey ? 'YES (Admin Access)' : 'NO (Public Access ONLY)'}`);

const fetch = require('node-fetch');

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    },
    global: {
        fetch: fetch
    }
});

module.exports = supabase;
