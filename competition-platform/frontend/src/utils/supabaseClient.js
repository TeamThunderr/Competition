// File Name: supabaseClient.js
// Purpose: Frontend connection to Supabase
// Written for beginner developers

import { createClient } from '@supabase/supabase-js'

// Note: In Vite, env variables must start with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a single supabase client for interacting with your database
// Create a single supabase client for interacting with your database
let supabase;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('Supabase URL or Key missing. Supabase functionality will be disabled.');
    // Dummy client to prevent crashes on import, but will fail on usage
    supabase = {
        auth: {
            session: () => null,
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
            signOut: async () => ({ error: null }),
        },
        from: () => ({
            select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }) }) })
        })
    };
}

export default supabase
