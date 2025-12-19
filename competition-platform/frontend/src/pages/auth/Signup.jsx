// File Name: Signup.jsx
// Purpose: User Registration Page
// Written for beginner developers

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { signInWithGoogle, signUpWithEmail } from '../../services/authService';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const result = await signUpWithEmail(email, password, role);

        if (result.success) {
            alert('Signup successful! Please check your email to confirm your account before logging in.');
            navigate('/login');
        } else {
            setError(result.error);
        }
    };

    const handleGoogleSignup = async () => {
        const result = await signInWithGoogle();
        if (!result.success) {
            setError(result.error);
        }
        // Supabase handles the redirect automatically
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-grow flex items-center justify-center">
                <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Sign Up</h2>

                    {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}

                    {/* Google Signup Button */}
                    <button
                        onClick={handleGoogleSignup}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition mb-4 flex items-center justify-center font-bold"
                    >
                        <span className="mr-2">🔵</span> Sign up with Google
                    </button>

                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="hod">HOD</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                        >
                            Sign Up
                        </button>
                    </form>
                    <div className="mt-4 text-center">
                        <p className="text-gray-600">Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log In</Link></p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Signup;
