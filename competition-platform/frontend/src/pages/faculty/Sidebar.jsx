import React from 'react';
import { LayoutDashboard, Users, CheckCircle, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import logo from '../../assets/logo.png';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logoutUser();
        navigate('/');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Mentor Dashboard', path: '/faculty' },
        { icon: Users, label: 'Student List', path: '/faculty/students' },
        { icon: CheckCircle, label: 'Verify Proofs', path: '/faculty/verify' },
        { icon: LayoutDashboard, label: 'All Competitions', path: '/faculty/competitions' },
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

            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:fixed md:inset-y-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Logo Section */}
                <div className="p-6 flex items-center justify-center">
                    <img src={logo} alt="Logo" className="w-48 h-auto object-contain mix-blend-multiply" />
                </div>

                {/* Menu Items */}
                <nav className="flex-1 px-4 py-4 space-y-2">
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    navigate(item.path);
                                    if (onClose) onClose();
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
