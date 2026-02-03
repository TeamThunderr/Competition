import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground transition-colors duration-200">
            <div className="p-8 bg-card rounded-xl shadow-xl border border-border w-96 backdrop-blur-md">
                <h2 className="text-3xl font-bold mb-6 text-center text-brand-600 dark:text-blue-400 glowing-text">Login</h2>

                {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-500 rounded-lg text-red-600 dark:text-red-200 text-sm text-center font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-foreground text-sm font-semibold mb-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 bg-muted/5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground placeholder-muted transition-all duration-300 hover:border-brand-400"
                            placeholder="Enter your email..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-bold text-white shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink-0 mx-4 text-muted text-sm font-medium">Or</span>
                        <div className="flex-grow border-t border-border"></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className={`w-full py-3 bg-white dark:bg-white text-gray-900 border border-border rounded-lg font-bold shadow-sm flex items-center justify-center gap-3 transition-all duration-200 hover:bg-gray-50 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        Sign in with Google
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
