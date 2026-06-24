import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Sparkles, Rocket, Target } from 'lucide-react';
import { loginUser } from '../../services/authService';
import { signInWithGoogle } from '../../services/supabaseClient';

const LoginForm = () => {
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

            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('role', data.role);
            if (data.token) {
                localStorage.setItem('token', data.token);
            }

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

    return (
        <div className="w-full max-w-md p-8 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-gray-200/20 dark:border-white/10 rounded-[2rem] shadow-2xl dark:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] relative overflow-hidden">
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

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 ml-1">Email Address</label>
                    <input
                        type="email"
                        className="w-full px-4 py-3 bg-white dark:bg-[#0f172a]/80 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 shadow-sm dark:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your email..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
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
    );
};

export default LoginForm;
