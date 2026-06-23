// File Name: authService.js
// Purpose: Handle Authentication (Backend only)

const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${baseApiUrl}/api/auth`;
import { supabase } from './supabaseClient';

export const loginUser = async (email) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Login failed');
    }

    const user = await response.json();

    // store user locally
    localStorage.setItem('user', JSON.stringify(user));
    return user;
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const logoutUser = async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Supabase SignOut Error:", error);
};
