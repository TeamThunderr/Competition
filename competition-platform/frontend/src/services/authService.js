// File Name: authService.js
// Purpose: Handle user login and logout using Supabase
// Written in beginner-friendly style

import supabase from './supabaseClient';

// What this function does: Logs in the user with Google
export const signInWithGoogle = async () => {
    try {
        // We ask Supabase to sign in with OAuth (Google)
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });

        if (error) {
            console.error('Error logging in with Google:', error.message);
            return { success: false, error: error.message };
        }

        // If successful, data will contain the URL to redirect to Google
        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error during login:', err);
        return { success: false, error: err.message };
    }
};

// What this function does: Signs up a new user with Email and Password
export const signUpWithEmail = async (email, password, role) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { role }, // Save the role (student, faculty, etc.)
            },
        });

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error during signup:', err);
        return { success: false, error: err.message };
    }
};

// What this function does: Logs in a user with Email and Password
export const signInWithEmail = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error during login:', err);
        return { success: false, error: err.message };
    }
};

// What this function does: Logs out the current user
export const signOutUser = async () => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Error signing out:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Unexpected error during sign out:', err);
        return { success: false, error: err.message };
    }
};

// What this function does: Gets the currently logged-in user
export const getCurrentUser = async () => {
    try {
        // We ask Supabase for the current session and user
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            // It's normal to have an error if no user is logged in
            console.log('No user currently logged in');
            return null;
        }

        return user;
    } catch (err) {
        console.error('Unexpected error getting user:', err);
        return null;
    }
};
