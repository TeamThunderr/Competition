// File Name: api.js
// Purpose: Centralized API handling with auto-header injection and error management.

import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

    // Remove Content-Type for FormData (Browser sets boundary)
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    // 2. Auto-inject Auth Header (Demo Mode)
    const user = getCurrentUser();
    if (user?.id) {
        headers['x-user-id'] = user.id;
    }

    // Auto-inject Supabase JWT Token (Production Mode)
    const { data: { session } } = await supabase.auth.getSession();
    const fallbackToken = localStorage.getItem('token');
    
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    } else if (fallbackToken) {
        headers['Authorization'] = `Bearer ${fallbackToken}`;
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

            // Auto-Logout if User ID is invalid (Stale State)
            if (response.status === 404 && errorBody.message === "User ID provided in header not found in database") {
                console.warn("[API] User ID invalid. Logging out...");
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return null; // Stop propagation
            }

            // Translate technical errors into user-friendly messages
            let errorMessage = errorBody.error || errorBody.message || `API Error: ${response.status}`;
            const lowerError = errorMessage.toLowerCase();

            if (response.status === 429 || lowerError.includes('rate limit') || lowerError.includes('too many requests')) {
                errorMessage = "You're doing that too fast. Please wait a moment and try again.";
            } else if (lowerError.includes('validation')) {
                errorMessage = "Some of the details provided are incorrect. Please check and try again.";
            } else if (response.status === 500 || lowerError.includes('internal server error') || lowerError.includes('database')) {
                errorMessage = "Something went wrong on our end. Please try again later.";
            } else if (response.status === 401 || lowerError.includes('unauthorized')) {
                errorMessage = "Your session has expired or you do not have permission. Please log in again.";
            } else if (lowerError.includes('network error') || lowerError.includes('failed to fetch')) {
                errorMessage = "Please check your internet connection and try again.";
            } else if (lowerError.includes('duplicate') || lowerError.includes('already exists')) {
                errorMessage = "This record already exists. Please try a different one.";
            }

            // Create a smarter error object
            const error = new Error(errorMessage);
            error.status = response.status;
            error.response = {
                status: response.status,
                data: errorBody
            };

            throw error;
        }

        // 6. Return Data based on Type
        if (response.status === 204) return null;

        // Handle Blob (File Download)
        if (options.responseType === 'blob') {
            return await response.blob();
        }

        // Default: JSON
        const data = await response.json();
        
        // Auto-extract paginated data for backward compatibility with components expecting arrays
        if (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data && 'total' in data) {
            const arr = data.data;
            if (Array.isArray(arr)) {
                arr.meta = {
                    total: data.total,
                    page: data.page,
                    limit: data.limit,
                    totalPages: data.totalPages
                };
                return arr;
            }
        }
        
        return data;

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error(`[API] Request failed: ${endpoint}`, error);
        }
        throw error;
    }
}

const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Exported Methods
export const api = {
    get: (endpoint, options = {}) => {
        // Skip cache if explicitly requested
        if (options.cache === false) {
            return request(endpoint, { method: 'GET', ...options });
        }
        
        const cacheKey = endpoint;
        
        // Return cached promise if valid
        if (apiCache.has(cacheKey)) {
            const cached = apiCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                return cached.promise;
            }
            apiCache.delete(cacheKey);
        }

        // Make new request and cache the promise
        const promise = request(endpoint, { method: 'GET', ...options }).catch(err => {
            apiCache.delete(cacheKey); // Remove from cache if it fails
            throw err;
        });

        apiCache.set(cacheKey, { promise, timestamp: Date.now() });
        return promise;
    },
    
    post: (endpoint, body, options = {}) => {
        apiCache.clear(); // Bust cache on mutation
        return request(endpoint, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
            ...options
        });
    },
    
    put: (endpoint, body, options = {}) => {
        apiCache.clear(); // Bust cache on mutation
        return request(endpoint, {
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body),
            ...options
        });
    },
    
    del: (endpoint, options = {}) => {
        apiCache.clear(); // Bust cache on mutation
        return request(endpoint, { method: 'DELETE', ...options });
    },

    // Check Health
    checkHealth: () => request('/health')
};
