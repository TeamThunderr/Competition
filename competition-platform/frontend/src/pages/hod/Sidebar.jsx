import React from 'react';
import { LayoutDashboard, CheckCircle, BarChart2, Bell, Briefcase, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../services/authService';

const HodSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logoutUser();
        navigate('/');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dept. Dashboard', path: '/hod' },
        { icon: CheckCircle, label: 'OD Approvals', path: '/hod/approvals' },
        { icon: BarChart2, label: 'Analytics', path: '/hod/analytics' },
        { icon: Bell, label: 'Notifications', path: '/hod/notifications' },
        { icon: Briefcase, label: 'All Competitions', path: '/hod/competitions' },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col fixed left-0 top-0">
            <div className="p-6 flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold text-gray-800">COMPETITION DASHBOARD</span>
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
                    onClick={handleLogout} // Assuming sign out goes to home or login
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default HodSidebar;
