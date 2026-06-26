// File Name: authService.js
// Purpose: Auth utilities used by AuthContext
//
// NOTE: The actual login logic lives in AuthContext.jsx (login function).
// This file provides helper utilities for reading/clearing auth state.

import { supabase } from './supabaseClient';

const STORAGE_KEYS = {
    USER: 'auth_user',
    ROLE: 'auth_role',
    TOKEN: 'auth_token',
};

/**
 * Get the currently logged-in user from localStorage.
 * Returns null if not logged in or storage is corrupt.
 */
export const getCurrentUser = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.USER);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

/**
 * Get the current auth token from localStorage.
 */
export const getCurrentToken = () => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN) || null;
};

/**
 * Get the current role from localStorage.
 */
export const getCurrentRole = () => {
    return localStorage.getItem(STORAGE_KEYS.ROLE) || null;
};

/**
 * Clear all auth state from localStorage and sign out of Supabase.
 * Prefer using AuthContext.logout() instead of calling this directly.
 */
export const logoutUser = async () => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    // Legacy keys cleanup (in case old keys exist)
    ['user', 'role', 'token'].forEach(k => localStorage.removeItem(k));
    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.warn('[AuthService] Supabase signOut error:', e);
    }
};

export { STORAGE_KEYS };
