// File Name: authService.js
// Purpose: Handle Authentication API calls to Backend
// Written for beginner developers

import supabase from './supabaseClient';

const API_URL = 'http://localhost:5000/api/auth';

export const loginUser = async (email) => {
    try {
        console.log("Logging in with email:", email);
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
        }

        return await response.json();
    } catch (error) {
        console.error("Auth Service Error:", error);
        throw error;
    }
};

export const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // Return user with ID and metadata
    return {
        id: session.user.id,
        email: session.user.email,
        ...session.user.user_metadata
    };
};
