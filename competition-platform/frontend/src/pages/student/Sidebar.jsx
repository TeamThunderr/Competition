import React from 'react';
import { LayoutDashboard, Globe, Users, FileText, Settings, LogOut, User, BarChart2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { logoutUser } from '../../services/authService';

const StudentSidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logoutUser();
        navigate('/');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
        { icon: Globe, label: 'Competitions', path: '/student/competitions' },
        { icon: User, label: 'Profile', path: '/student/profile' },
        { icon: BarChart2, label: 'Analytics', path: '/student/stats' },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:fixed md:inset-y-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="p-6 flex items-center justify-center">
                    <img src={logo} alt="Logo" className="w-48 h-auto object-contain mix-blend-multiply" />
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    navigate(item.path);
                                    if (onClose) onClose();
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-200"
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

export default StudentSidebar;
