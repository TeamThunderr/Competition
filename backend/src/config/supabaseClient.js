// File Name: supabaseClient.js
// Purpose: Connect to Supabase database
// Written for beginner developers

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Get these from your Supabase dashboard
const supabaseUrl = process.env.SUPABASE_URL;

// Key selection priority: SUPABASE_SERVICE_KEY > SUPABASE_SERVICE_ROLE_KEY > SUPABASE_ANON_KEY
//
// PRODUCTION REMINDER:
//   The backend should always use SUPABASE_SERVICE_ROLE_KEY (a.k.a. service_role) to bypass
//   Row Level Security (RLS). Using SUPABASE_ANON_KEY in production means RLS policies
//   will block backend writes (e.g., detected hackathons, OD approvals) unless explicit
//   "anon" policies are added — which is insecure.
//
//   ✅ Set SUPABASE_SERVICE_ROLE_KEY in your production .env
//   ❌ Never expose the service role key to the browser / frontend
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

const supabaseKey = serviceKey || anonKey;

console.log('[SupabaseConfig] Initializing Client...');
console.log(`[SupabaseConfig] Using Service Key? ${!!serviceKey ? 'YES (Admin Access)' : 'NO (Public Access ONLY)'}`);

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

module.exports = supabase;
