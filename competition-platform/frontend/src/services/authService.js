// File Name: authService.js
// Purpose: Handle Authentication (Backend only)

const API_URL = 'http://localhost:5000/api/auth';

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

export const logoutUser = () => {
    localStorage.removeItem('user');
};
