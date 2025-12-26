// File Name: api.js
// Purpose: Centralized API handling with auto-header injection and error management.

const API_BASE_URL = 'http://localhost:5000';

/**
 * Get the current user from storage safely.
 */
const getCurrentUser = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

/**
 * Generic Request Handler
 */
async function request(endpoint, options = {}) {
    // 1. Prepare Headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // 2. Auto-inject Auth Header (Demo Mode)
    const user = getCurrentUser();
    if (user?.id) {
        headers['x-user-id'] = user.id;
    }

    // 3. Configure Config
    const config = {
        ...options,
        headers,
    };

    // 4. Execute Fetch
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // 5. Handle Non-200 Responses
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || errorBody.message || `API Error: ${response.status}`);
        }

        // 6. Return JSON
        // Some endpoints might return empty body (204)
        if (response.status === 204) return null;
        return await response.json();

    } catch (error) {
        console.error(`[API] Request failed: ${endpoint}`, error);
        throw error;
    }
}

// Exported Methods
export const api = {
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    del: (endpoint) => request(endpoint, { method: 'DELETE' }),

    // Check Health
    checkHealth: () => request('/health')
};
