// File Name: AuthContext.jsx
// Purpose: Single source of truth for authentication state across the entire app.
//
// Provides:
//   - user      : full user object from the DB
//   - role      : user's role (STUDENT / FACULTY / HOD / ADMIN)
//   - token     : the Supabase access_token (Bearer token for API calls)
//   - isLoading : true while auth state is being determined on app start
//   - login(token) : verifies token with backend, stores state
//   - logout()     : clears all state and signs out of Supabase

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
    USER: 'auth_user',
    ROLE: 'auth_role',
    TOKEN: 'auth_token',
};

// ─── Helper: call /api/auth/login with a Bearer token ────────────────────────
const verifyTokenWithBackend = async (token) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Login failed');
    }

    return response.json(); // { user, role, token }
};

// ─────────────────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // ── On mount: restore state from localStorage ─────────────────────────────
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
            const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE);
            const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);

            if (storedUser && storedRole && storedToken) {
                setUser(JSON.parse(storedUser));
                setRole(storedRole);
                setToken(storedToken);
            }
        } catch {
            // Corrupt storage — clear it
            Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── login: called after Supabase OAuth gives us an access_token ───────────
    const login = useCallback(async (supabaseToken) => {
        setIsLoading(true);
        try {
            const data = await verifyTokenWithBackend(supabaseToken);

            // Persist to localStorage
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
            localStorage.setItem(STORAGE_KEYS.ROLE, data.role);
            localStorage.setItem(STORAGE_KEYS.TOKEN, supabaseToken);

            setUser(data.user);
            setRole(data.role);
            setToken(supabaseToken);

            return data; // caller uses data.role to navigate
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── logout: clears all state ──────────────────────────────────────────────
    const logout = useCallback(async () => {
        // Clear storage
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));

        // Clear state
        setUser(null);
        setRole(null);
        setToken(null);

        // Sign out of Supabase (invalidates the OAuth session)
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn('[Auth] Supabase signOut error:', e);
        }
    }, []);

    const value = {
        user,
        role,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─────────────────────────────────────────────────────────────────────────────
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside <AuthProvider>');
    }
    return context;
};

export default AuthContext;
