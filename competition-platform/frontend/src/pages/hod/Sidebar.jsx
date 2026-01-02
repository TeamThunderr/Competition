import React from 'react';
import { LayoutDashboard, CheckCircle, BarChart2, Bell, Briefcase, LogOut, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { logoutUser } from '../../services/authService';

const HodSidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logoutUser();
        navigate('/');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dept. Dashboard', path: '/hod' },
        { icon: Users, label: 'Faculty Directory', path: '/hod/faculty' },
        { icon: CheckCircle, label: 'OD Approvals', path: '/hod/approvals' },
        { icon: BarChart2, label: 'Analytics', path: '/hod/analytics' },
        { icon: Briefcase, label: 'All Competitions', path: '/hod/competitions' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 transform 
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

                <div className="p-6 flex items-center justify-between">
                    <div className="flex justify-center flex-1">
                        <img src={logo} alt="Logo" className="w-48 h-auto object-contain mix-blend-multiply" />
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
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

export default HodSidebar;
