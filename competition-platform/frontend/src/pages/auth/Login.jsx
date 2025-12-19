import { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { signInWithGoogle } from '../../services/authService';

const Login = () => {
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
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
                    <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Welcome Back</h2>
                    <p className="text-center text-gray-600 mb-6">Please sign in with your college email (@citchennai.net)</p>

                    {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded hover:bg-gray-50 transition mb-4 flex items-center justify-center font-bold shadow-sm cursor-pointer"
                    >
                        <span className="mr-2">🔵</span> Sign in with Google
                    </button>

                    <div className="mt-4 text-center text-sm text-gray-500">
                        <p>Restricted to CIT Chennai students and faculty.</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Login;
