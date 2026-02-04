import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Sparkles, Rocket, Target, Zap } from 'lucide-react';
import { loginUser } from '../../services/authService';
import { signInWithGoogle, supabase, signOut } from '../../services/supabaseClient';
import { api } from '../../services/api';
import { useEffect } from 'react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            console.log("Attempting login with:", email);
            const data = await loginUser(email);
            console.log("Login successful:", data);

            // Store user details in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('role', data.role);

            // Redirect based on role
            if (data.role === 'STUDENT') navigate('/student');
            else if (data.role === 'FACULTY') navigate('/faculty');
            else if (data.role === 'HOD') navigate('/hod');
            else if (data.role === 'ADMIN') navigate('/admin');
            else navigate('/');

        } catch (err) {
            console.error("Login failed:", err);
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err) {
            console.error("Google login initiation failed:", err);
            setError("Failed to start Google login.");
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                console.log("Supabase session found:", session.user.email);

                // --- NEW: Save Google Refresh Token if present ---
                // "provider_refresh_token" is available in the session object directly after OAuth callback
                const providerRefreshToken = session.provider_refresh_token;

                if (providerRefreshToken) {
                    console.log("Found Provider Refresh Token, saving to backend...");
                    try {
                        // Use the 'api' wrapper to ensure correct BASE_URL (http://localhost:5000)
                        await api.post('/api/auth/save-token', {
                            email: session.user.email,
                            refreshToken: providerRefreshToken
                        });
                        console.log("Token saved successfully.");
                    } catch (tokErr) {
                        console.error("Failed to save google token:", tokErr);
                        // Don't block login, just log error
                    }
                }
                // -------------------------------------------------

                // User is authenticated with Supabase (Google), now check with our backend
                try {
                    setLoading(true);
                    const data = await loginUser(session.user.email);

                    console.log("[Login] Backend returned user:", data.user);
                    console.log("[Login] Storing user ID:", data.user.id);

                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('role', data.role);

                    if (data.role === 'STUDENT') navigate('/student');
                    else if (data.role === 'FACULTY') navigate('/faculty');
                    else if (data.role === 'HOD') navigate('/hod');
                    else if (data.role === 'ADMIN') navigate('/admin');
                    else navigate('/');
                } catch (err) {
                    console.error("Backend validation failed after Google Auth:", err);
                    setError("Login failed: Your email is not registered in our system.");
                    // Force signout from Supabase so they can try again or try another account
                    await signOut();
                } finally {
                    setLoading(false);
                }
            }
        };

        checkSession();
    }, [navigate]);

    // --- Animation Variants ---
    const pageTransition = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.6 } }
    };

    const formSlideIn = {
        hidden: { x: 50, opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { duration: 0.6, delay: 0.2, ease: "easeOut" } }
    };

    const textFadeIn = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.6, delay: 0.4, ease: "easeOut" } }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={pageTransition}
            className="flex min-h-screen bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-white overflow-hidden relative font-sans transition-colors duration-300"
        >
            {/* Ambient Background Lights & Grid */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-300/30 dark:bg-indigo-600/30 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-300/30 dark:bg-purple-600/30 rounded-full blur-[150px] animate-pulse delay-1000" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            {/* Left Side: Decorative & Info (Hidden on mobile) */}
            <div className="hidden lg:flex flex-1 relative z-10 flex-col justify-center px-16">
                <motion.div variants={textFadeIn} className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs font-medium text-indigo-600 dark:text-indigo-300 mb-6 backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Secure Access Portal
                    </div>
                    <h1 className="text-6xl font-bold tracking-tight mb-6 leading-tight drop-shadow-sm dark:drop-shadow-lg text-gray-900 dark:text-white">
                        Welcome <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 animate-gradient-x">
                            Back
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed dark:drop-shadow-md">
                        Sign in to manage your competitions, track team progress, and handle approvals with our premium dashboard.
                    </p>
                </motion.div>

                {/* Floating Decorative Icons at the bottom/background of left panel */}
                {/* Floating Decorative Icons at the bottom/background of left panel */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {/* Trophy: Moved to Bottom Right */}
                    <motion.div
                        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-[10%] right-[5%] opacity-20 dark:opacity-30"
                    >
                        <Trophy className="w-24 h-24 text-yellow-500" />
                    </motion.div>

                    {/* Rocket: Keep Bottom Left */}
                    <motion.div
                        animate={{ y: [0, 25, 0], rotate: [0, -10, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-[15%] left-[5%] opacity-20 dark:opacity-20"
                    >
                        <Rocket className="w-20 h-20 text-purple-500" />
                    </motion.div>

                    {/* Sparkles: Move to Top Right */}
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 15, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute top-[15%] right-[10%] opacity-15 dark:opacity-25"
                    >
                        <Sparkles className="w-16 h-16 text-indigo-400" />
                    </motion.div>

                    {/* Target: Move to Top Left */}
                    <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="absolute top-[10%] left-[10%] opacity-10 dark:opacity-15"
                    >
                        <Target className="w-14 h-14 text-pink-500" />
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <motion.div
                variants={formSlideIn}
                className="flex-1 flex items-center justify-center relative z-10 px-4 sm:px-8"
            >
                <div className="w-full max-w-md p-8 bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-2xl dark:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
                    <h2 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">Login</h2>
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">Enter your credentials to access your account</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-3 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm text-center font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 ml-1">Email Address</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 bg-white dark:bg-[#0f172a]/80 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 shadow-sm dark:shadow-inner"
                                placeholder="Enter your email..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-lg dark:shadow-[0_0_20px_rgba(79,70,229,0.4)] transform transition-all duration-200 hover:scale-[1.02] active:scale-95 flex justify-center items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Sign In'}
                        </button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-300 dark:border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm font-medium">Or continue with</span>
                            <div className="flex-grow border-t border-gray-300 dark:border-white/10"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className={`w-full py-3.5 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold shadow-sm flex items-center justify-center gap-3 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-100 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google
                        </button>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Login;
