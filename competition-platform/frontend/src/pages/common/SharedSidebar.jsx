import React from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import logo from '../../assets/logo.png';

/**
 * SharedSidebar Component
 * 
 * A reusable sidebar for all user roles.
 * Supports mobile responsive toggling, dark mode, and new design tokens.
 * 
 * @param {Array} menuItems - Array of objects { icon, label, path }
 * @param {boolean} isOpen - Mobile drawer open state
 * @param {function} onClose - Function to close mobile drawer
 */
const SharedSidebar = ({ menuItems, isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = async () => {
        await logoutUser();
        navigate('/');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Container */}
            <div className={`fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar border-r border-border flex flex-col transition-transform duration-300 ease-in-out transform 
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

                {/* Logo Section */}
                <div className="p-6 flex items-center justify-center border-b border-border">
                    <img src={logo} alt="Logo" className="w-40 h-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:brightness-200" />
                </div>

                {/* Menu Items */}
                <nav className="flex-1 px-3 space-y-1 mt-6 overflow-y-auto">
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    navigate(item.path);
                                    if (onClose) onClose(); // Close sidebar on mobile when navigating
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${isActive
                                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                                    : 'text-muted hover:bg-gray-50 hover:text-foreground dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-slate-500'} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-border space-y-2">
                    <button
                        className="w-full flex items-center space-x-3 px-4 py-3 text-muted hover:bg-gray-50 hover:text-foreground dark:hover:bg-slate-800 dark:hover:text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                        onClick={toggleTheme}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    <button
                        className="w-full flex items-center space-x-3 px-4 py-3 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 dark:hover:text-red-400 rounded-lg transition-colors duration-200 text-sm font-medium"
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
