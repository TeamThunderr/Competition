// File Name: authService.js
// Purpose: Handle Authentication API calls to Backend
// Written for beginner developers

import { checkBackendHealth } from './api'; // Reusing base api if needed

const API_URL = 'http://localhost:5000/api/auth';

export const loginUser = async (email, password) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return await response.json();
    } catch (error) {
        throw error;
    }
};
