import React from 'react';
import { LayoutDashboard, Globe, Users, FileText, Settings, LogOut, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { logoutUser } from '../../services/authService';

const StudentSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logoutUser();
        navigate('/');
    };

    const menuItems = [
        { icon: Globe, label: 'Competitions', path: '/student/competitions' },
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
        { icon: User, label: 'My Profile', path: '/student/profile' },
        { icon: FileText, label: 'OD Letters', path: '/student/od-letters' },
        { icon: Settings, label: 'Settings', path: '/student/settings' },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center justify-center">
                <img src={logo} alt="Logo" className="w-48 h-auto object-contain mix-blend-multiply" />
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={index}
                            onClick={() => navigate(item.path)}
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
    );
};

export default StudentSidebar;
