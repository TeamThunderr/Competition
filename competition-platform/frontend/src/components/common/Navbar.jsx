// File Name: Navbar.jsx
// Purpose: Main navigation bar
// Written for beginner developers

import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="bg-blue-600 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold">Competition Platform</Link>
                <div className="space-x-4">
                    {/* Links handled by Router */}
                    <Link to="/login" className="hover:text-blue-200">Login</Link>
                    <Link to="/signup" className="hover:text-blue-200">Signup</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
