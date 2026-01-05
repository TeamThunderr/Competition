import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import logo from '../../assets/logo.png';

/**
 * SharedSidebar Component
 * 
 * A reusable sidebar for all user roles.
 * 
 * @param {Array} menuItems - Array of objects { icon, label, path }
 */
/**
 * SharedSidebar Component
 * 
 * A reusable sidebar for all user roles.
 * Supports mobile responsive toggling.
 * 
 * @param {Array} menuItems - Array of objects { icon, label, path }
 * @param {boolean} isOpen - Mobile drawer open state
 * @param {function} onClose - Function to close mobile drawer
 */
const SharedSidebar = ({ menuItems, isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logoutUser();
        navigate('/');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Container */}
            <div className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out transform 
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

                {/* Logo Section */}
                <div className="p-6 flex items-center justify-center">
                    <img src={logo} alt="Logo" className="w-48 h-auto object-contain mix-blend-multiply" />
                </div>

                {/* Menu Items */}
                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    navigate(item.path);
                                    if (onClose) onClose(); // Close sidebar on mobile when navigating
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium ${isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default SharedSidebar;
