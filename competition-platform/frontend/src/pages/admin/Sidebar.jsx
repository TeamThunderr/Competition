import React, { useState } from 'react';
import { LayoutDashboard, Search, Upload, Bookmark, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import logo from '../../assets/logo.png';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { icon: LayoutDashboard, label: 'CIT Dashboard', path: '/admin' },
        { icon: Search, label: 'Student Search', path: '/admin/search' },
        { icon: Upload, label: 'Manage Competitions', path: '/admin/upload' },
        { icon: Bookmark, label: 'Global Repository', path: '/admin/repository' },
        { icon: BarChart3, label: 'Dept. Performance', path: '/admin/performance' },
    ];

    const handleLogout = async () => {
        await logoutUser();
        navigate('/');
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-gray-700 hover:text-blue-600"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay Backdrop */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Logo Section */}
                <div className="p-6 flex items-center justify-center">
                    <img src={logo} alt="Logo" className="w-48 h-auto object-contain mix-blend-multiply" />
                </div>

                {/* Menu Items */}
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    navigate(item.path);
                                    setIsOpen(false);
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

export default Sidebar;
