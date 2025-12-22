// File Name: supabaseClient.js
// Purpose: Frontend connection to Supabase
// Written for beginner developers

import { createClient } from '@supabase/supabase-js'

// Note: In Vite, env variables must start with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
