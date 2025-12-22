import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';

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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-white">
            <div className="p-8 bg-gray-900 bg-opacity-80 rounded-lg shadow-xl border border-gray-700 w-96 backdrop-blur-md">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-400 glowing-text">Login</h2>

                {error && <div className="mb-4 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 text-sm font-semibold mb-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition-all duration-300 hover:border-blue-400"
                            placeholder="Enter your email..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-md font-bold text-white shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
