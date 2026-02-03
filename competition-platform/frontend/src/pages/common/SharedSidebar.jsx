import React from 'react';
import { LogOut, Sun, Moon, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import logoLight from '../../assets/logo.png';
import logoDark from '../../assets/logo-dark.png'; // Make sure to import the new file



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
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    // Update global CSS variable for layout adjustment
    React.useEffect(() => {
        const width = isCollapsed ? '5rem' : '16rem'; // w-20 vs w-64
        document.documentElement.style.setProperty('--sidebar-width', width);
    }, [isCollapsed]);

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
            <div
                className={`fixed top-0 left-0 z-40 h-[calc(100vh-2rem)] transition-all duration-300 ease-in-out m-4 rounded-2xl border border-border shadow-2xl flex flex-col
                ${isCollapsed ? 'w-20' : 'w-64'}
                ${isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'} md:translate-x-0
                bg-white dark:bg-[#1e1b4b]`}
            >

                {/* Toggle Button (Desktop only) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute -right-3 top-10 bg-white dark:bg-indigo-600 border border-border dark:border-indigo-500 rounded-full p-1 shadow-md text-gray-500 dark:text-white hover:scale-110 transition-transform z-50"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Logo Section */}
                <div className={`p-6 flex items-center justify-center border-b border-gray-100 dark:border-indigo-900/30 transition-all duration-300`}>
                    {!isCollapsed ? (
                        <div className="flex items-center justify-center overflow-hidden w-full">
                            {/* Full Logo for expanded state */}
                            <img
                                src={theme === 'dark' ? logoDark : logoLight}
                                alt="Competition Dashboard"
                                className={`w-48 h-auto object-contain transition-all duration-300 transform hover:scale-105 
                                    ${theme === 'dark'
                                        ? 'hover:drop-shadow-[0_0_25px_rgba(129,140,248,0.9)]'
                                        : 'mix-blend-multiply hover:drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]'
                                    }`}
                            />
                        </div>
                    ) : (
                        // Simple Icon for collapsed state
                        <div className="flex items-center justify-center w-full">
                            <img
                                src="/logo.png"
                                alt="Icon"
                                className="w-10 h-10 object-contain hover:scale-110 transition-transform duration-200 drop-shadow-md"
                            />
                        </div>
                    )}
                </div>

                {/* Menu Items */}
                <nav className="flex-1 px-3 space-y-2 mt-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {menuItems.map((item, index) => {
                        const pathSegments = item.path.split('/').filter(Boolean);
                        const isRootPath = pathSegments.length === 1;
                        const isActive = location.pathname === item.path ||
                            (!isRootPath && location.pathname.startsWith(item.path + '/'));

                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    navigate(item.path);
                                    if (onClose) onClose();
                                }}
                                title={isCollapsed ? item.label : ''}
                                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl transition-all duration-200 font-medium group relative
                                ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-indigo-200 dark:hover:bg-indigo-900/50 dark:hover:text-white'
                                    }`}
                            >
                                <item.icon size={22} className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-indigo-600 dark:text-white' : 'text-gray-400 dark:text-indigo-300 group-hover:text-gray-600 dark:group-hover:text-white'}`} />

                                <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
                                    {item.label}
                                </span>

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                        {item.label}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className={`p-4 border-t border-gray-100 dark:border-indigo-900/30 space-y-2`}>
                    <button
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl transition-all duration-200 font-medium
                        text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-indigo-200 dark:hover:bg-indigo-900/50 dark:hover:text-white`}
                        onClick={toggleTheme}
                        title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : ''}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </button>

                    <button
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl transition-all duration-200 font-medium
                        text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-indigo-200 dark:hover:bg-red-900/20 dark:hover:text-red-400`}
                        onClick={handleLogout}
                        title={isCollapsed ? 'Sign Out' : ''}
                    >
                        <LogOut size={20} />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
                            Sign Out
                        </span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default SharedSidebar;
