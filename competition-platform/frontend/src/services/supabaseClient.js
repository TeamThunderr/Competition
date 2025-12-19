// File Name: supabaseClient.js
// Purpose: Connect the frontend to Supabase
// Written in beginner-friendly style

// Import the function to create a Supabase client
import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and Key from the environment variables (frontend/.env)
// We use import.meta.env because we are using Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Create the Supabase client
// This 'supabase' object will be used to talk to the database and handle login
const supabase = createClient(supabaseUrl, supabaseKey);

// Export the client so other files can use it
export default supabase;
