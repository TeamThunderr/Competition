import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import { loginUser } from '../../services/authService';
import { signInWithGoogle, supabase, signOut } from '../../services/supabaseClient';
import { api } from '../../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showEmail, setShowEmail] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await loginUser(email);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('role', data.role);

            if (data.role === 'STUDENT') navigate('/student');
            else if (data.role === 'FACULTY') navigate('/faculty');
            else if (data.role === 'HOD') navigate('/hod');
            else if (data.role === 'ADMIN') navigate('/admin');
            else navigate('/');
        } catch (err) {
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
            setError("Failed to start Google login.");
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            if (window.location.hash && window.location.hash.includes('access_token')) {
                setLoading(true);
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                if (window.location.hash) {
                    window.history.replaceState(null, '', window.location.pathname);
                }
                
                setLoading(true);
                const providerRefreshToken = session.provider_refresh_token;

                if (providerRefreshToken) {
                    api.post('/api/auth/save-token', {
                        email: session.user.email,
                        refreshToken: providerRefreshToken
                    }).catch(() => {});
                }

                try {
                    const data = await loginUser(session.user.email);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('role', data.role);

                    if (data.role === 'STUDENT') navigate('/student');
                    else if (data.role === 'FACULTY') navigate('/faculty');
                    else if (data.role === 'HOD') navigate('/hod');
                    else if (data.role === 'ADMIN') navigate('/admin');
                    else navigate('/');
                } catch (err) {
                    setError("Login failed: Your email is not registered in our system.");
                    await signOut();
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        checkSession();
    }, [navigate]);

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-black transition-colors duration-500 font-sans">
            
            {/* Ambient Aurora Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                
                {/* Moving Blobs */}
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

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 p-4 bg-red-50/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm text-center font-medium backdrop-blur-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Authentication Flow */}
                    <div className="relative overflow-hidden min-h-[220px]">
                        <AnimatePresence mode="wait">
                            {!showEmail ? (
                                /* Primary View: Google Auth */
                                <motion.div 
                                    key="google-auth"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col gap-4 absolute inset-0 w-full"
                                >
                                    <button
                                        onClick={handleGoogleLogin}
                                        disabled={loading}
                                        className="group relative flex items-center justify-center gap-3 w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-white px-6 py-4 rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                                    >
                                        {/* Subtle hover gradient effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 dark:from-white/0 dark:via-white/5 dark:to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                        
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
                                        <span>Continue with Google</span>
                                    </button>

                                    <button
                                        onClick={() => setShowEmail(true)}
                                        className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-2 flex items-center justify-center gap-2 group"
                                    >
                                        <Mail className="w-4 h-4 opacity-70" />
                                        Sign in with Email
                                    </button>
                                </motion.div>
                            ) : (
                                /* Secondary View: Email Auth */
                                <motion.div 
                                    key="email-auth"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col w-full absolute inset-0"
                                >
                                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                                        <div className="mb-4">
                                            <input
                                                type="email"
                                                className="w-full px-5 py-4 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`w-full py-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl font-bold text-white shadow-md transition-all duration-200 active:scale-95 flex justify-center items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                                <>
                                                    Continue
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setShowEmail(false)}
                                            className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors py-2 flex items-center justify-center gap-2"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Back to options
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
                
                {/* Footer Link / Decor */}
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8 font-medium">
                    &copy; {new Date().getFullYear()} Chennai Institute of Technology
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
