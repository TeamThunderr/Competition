// File Name: authService.js
// Purpose: Assignments for Auth API
// Written for beginner developers

import supabase from './supabaseClient';

export const login = async (email, password) => {
    // TODO: Add real login logic
    console.log('Logging in:', email);
    return { user: { email, role: 'student' } };
};

export const logout = async () => {
    console.log('Logging out');
};
