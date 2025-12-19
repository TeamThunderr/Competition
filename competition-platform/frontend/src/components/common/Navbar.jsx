// File Name: Navbar.jsx
// Purpose: Main navigation bar
// Written for beginner developers

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, signOutUser } from '../../services/authService';
import supabase from '../../services/supabaseClient';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // What this function does: Checks if a user is logged in
    const checkUser = async () => {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
    };

    // What this function does: Logs out the user
    const handleLogout = async () => {
        await signOutUser();
        setUser(null);
        navigate('/'); // Go to homepage after logout
    };

    // UseEffect runs this code when the component loads
    useEffect(() => {
        checkUser();

        // Listen for login/logout events from Supabase
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event);
            setUser(session?.user ?? null);
        });

        // Cleanup the listener when the component is removed
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <nav className="bg-blue-600 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold">College Competition Platform</Link>
                <div className="space-x-4 flex items-center">
                    {/* If user is logged in, show Logout. Otherwise show Login/Signup */}
                    {user ? (
                        <>
                            <span className="text-sm bg-blue-700 px-3 py-1 rounded">
                                Hello, {user.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-blue-200">Login</Link>
                            <Link to="/signup" className="hover:text-blue-200">Signup</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
