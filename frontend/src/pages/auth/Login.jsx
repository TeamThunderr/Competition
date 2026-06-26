import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, signInWithGoogle } from '../../services/supabaseClient';

// Role → dashboard path mapping
const ROLE_PATHS = {
    STUDENT: '/student',
    FACULTY: '/faculty',
    HOD: '/hod',
    ADMIN: '/admin',
};

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, role } = useAuth();

    // If already authenticated, redirect immediately
    useEffect(() => {
        if (isAuthenticated && role) {
            const path = ROLE_PATHS[role] || '/';
            navigate(path, { replace: true });
        }
    }, [isAuthenticated, role, navigate]);

    // Show reason if redirected here from a ProtectedRoute
    useEffect(() => {
        const reason = location.state?.reason;
        if (reason === 'unauthenticated') {
            setError('Please log in to access this page.');
        } else if (reason === 'unauthorized') {
            const wrongRole = location.state?.userRole;
            setError(`Your account (${wrongRole}) doesn't have access to that page.`);
        }
    }, [location.state]);

    // ── Handle Supabase OAuth callback ─────────────────────────────────────────
    useEffect(() => {
        const handleOAuthCallback = async () => {
            // Supabase puts the token in the URL hash after OAuth redirect
            const hasOAuthCallback =
                window.location.hash?.includes('access_token') ||
                window.location.search?.includes('code=');

            if (hasOAuthCallback) {
                setLoading(true);
                // Clean URL immediately
                window.history.replaceState(null, '', window.location.pathname);
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.access_token) {
                    setLoading(true);

                    // Save Google refresh token for Gmail integration (if available)
                    if (session.provider_refresh_token) {
                        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                        fetch(`${baseUrl}/api/auth/save-token`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: session.user.email,
                                refreshToken: session.provider_refresh_token,
                            }),
                        }).catch(() => {}); // fire and forget
                    }

                    // Verify with backend and store auth state
                    const data = await login(session.access_token);
                    const path = ROLE_PATHS[data.role] || '/';
                    navigate(path, { replace: true });
                } else {
                    setLoading(false);
                }
            } catch (err) {
                setError(err.message || 'Login failed. Your email may not be registered in this system.');
                await supabase.auth.signOut().catch(() => {});
                setLoading(false);
            }
        };

        handleOAuthCallback();
    }, [login, navigate]);

    // ── Google login button handler ────────────────────────────────────────────
    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            // After this, user is redirected to Google, then back to /login
            // The useEffect above handles the callback
        } catch (err) {
            setError('Failed to start Google sign-in. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-black transition-colors duration-500 font-sans">

            {/* Ambient Aurora Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay"></div>

                <motion.div
                    animate={{
                        x: [0, 100, -50, 0],
                        y: [0, -100, 50, 0],
                        scale: [1, 1.2, 0.9, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400/30 dark:bg-white/5 blur-[120px]"
                />
                <motion.div
                    animate={{
                        x: [0, -100, 50, 0],
                        y: [0, 100, -50, 0],
                        scale: [1, 0.9, 1.2, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-400/30 dark:bg-white/5 blur-[120px]"
                />
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[420px] mx-4"
            >
                <div className="backdrop-blur-2xl bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] rounded-[2rem] p-8 sm:p-10">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                            className="inline-flex justify-center items-center w-20 h-20 rounded-2xl bg-white dark:bg-white/10 shadow-sm border border-gray-100 dark:border-white/5 mb-6"
                        >
                            <img src="/cit.png" alt="CIT Logo" className="w-12 h-12 object-contain" />
                        </motion.div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            CIT Competition Management System
                        </p>
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 bg-red-50/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm text-center font-medium backdrop-blur-sm flex items-center justify-center gap-2"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Google Sign In Button */}
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="group relative flex items-center justify-center gap-3 w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-white px-6 py-4 rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                        >
                            {/* Hover shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 dark:from-white/0 dark:via-white/5 dark:to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            )}
                            <span>{loading ? 'Signing in…' : 'Continue with Google'}</span>
                        </button>

                        <p className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium px-4">
                            Use your CIT account to sign in.
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8 font-medium">
                    &copy; {new Date().getFullYear()} Chennai Institute of Technology
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
