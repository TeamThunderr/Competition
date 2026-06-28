// File Name: api.js
// Purpose: Centralized API handling with automatic auth header injection.
//
// Single token strategy: always reads from localStorage('auth_token').
// No more dual-token confusion (Supabase session vs custom JWT).
// Includes auto-logout on 401 Unauthorized.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'auth_token';

/**
 * Get the stored auth token.
 */
const getToken = () => localStorage.getItem(TOKEN_KEY);

/**
 * Perform a full logout and redirect to /login.
 * Called automatically when we receive a 401.
 */
const handleAuthFailure = () => {
    console.warn('[API] Auth failure — clearing session and redirecting to login.');
    ['auth_user', 'auth_role', 'auth_token', 'user', 'role', 'token'].forEach(k =>
        localStorage.removeItem(k)
    );
    window.location.href = '/login';
};

/**
 * Core request function.
 */
async function request(endpoint, options = {}) {
    // ── Build headers ─────────────────────────────────────────────────────────
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Remove Content-Type for FormData (browser sets multipart boundary)
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    // Inject auth token — one source, always
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    // ── Execute fetch ─────────────────────────────────────────────────────────
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // ── Handle 401 — session expired or invalid ───────────────────────────
        if (response.status === 401) {
            handleAuthFailure();
            return null;
        }

        // ── Handle other non-2xx responses ────────────────────────────────────
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));

            let errorMessage = errorBody.error || errorBody.message || `API Error: ${response.status}`;
            const lowerError = errorMessage.toLowerCase();

            if (response.status === 429 || lowerError.includes('rate limit') || lowerError.includes('too many')) {
                errorMessage = "You're doing that too fast. Please wait a moment and try again.";
            } else if (lowerError.includes('validation')) {
                errorMessage = 'Some details provided are incorrect. Please check and try again.';
            } else if (response.status === 500 || lowerError.includes('internal server error') || lowerError.includes('database')) {
                errorMessage = 'Something went wrong on our end. Please try again later.';
            } else if (lowerError.includes('network error') || lowerError.includes('failed to fetch')) {
                errorMessage = 'Please check your internet connection and try again.';
            } else if (lowerError.includes('duplicate') || lowerError.includes('already exists')) {
                errorMessage = 'This record already exists. Please try a different one.';
            } else if (response.status === 403) {
                errorMessage = 'You do not have permission to perform this action.';
            }

            const error = new Error(errorMessage);
            error.status = response.status;
            error.response = { status: response.status, data: errorBody };
            throw error;
        }

        // ── Handle 204 No Content ─────────────────────────────────────────────
        if (response.status === 204) return null;

        // ── Handle Blob (file download) ───────────────────────────────────────
        if (options.responseType === 'blob') {
            return await response.blob();
        }

        // ── Default: JSON ─────────────────────────────────────────────────────
        const data = await response.json();

        // Auto-extract paginated data for backward compatibility
        if (
            data &&
            typeof data === 'object' &&
            !Array.isArray(data) &&
            'data' in data &&
            'total' in data
        ) {
            const arr = data.data;
            if (Array.isArray(arr)) {
                arr.meta = {
                    total: data.total,
                    page: data.page,
                    limit: data.limit,
                    totalPages: data.totalPages,
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

// ─── Simple in-memory cache ───────────────────────────────────────────────────
const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Exported API methods ─────────────────────────────────────────────────────
export const api = {
    get: (endpoint, options = {}) => {
        const { cache: bypassCache, ...reqOptions } = options;
        if (bypassCache === false) {
            return request(endpoint, { method: 'GET', ...reqOptions });
        }

        const cacheKey = endpoint;

        if (apiCache.has(cacheKey)) {
            const cached = apiCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                return cached.promise;
            }
            apiCache.delete(cacheKey);
        }

        const promise = request(endpoint, { method: 'GET', ...reqOptions }).catch(err => {
            apiCache.delete(cacheKey);
            throw err;
        });

        apiCache.set(cacheKey, { promise, timestamp: Date.now() });
        return promise;
    },

    post: (endpoint, body, options = {}) => {
        apiCache.clear();
        return request(endpoint, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
            ...options,
        });
    },

    put: (endpoint, body, options = {}) => {
        apiCache.clear();
        return request(endpoint, {
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body),
            ...options,
        });
    },

    del: (endpoint, options = {}) => {
        apiCache.clear();
        return request(endpoint, { method: 'DELETE', ...options });
    },

    checkHealth: () => request('/health'),
};
