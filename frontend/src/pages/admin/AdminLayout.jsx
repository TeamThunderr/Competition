import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SharedSidebar from '../common/SharedSidebar';
import { Menu, LayoutDashboard, Search, Upload, Bookmark, BarChart3, Sparkles } from 'lucide-react';
import logo from '../../assets/logo.png';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const menuItems = [
        { icon: LayoutDashboard, label: 'CIT Dashboard', path: '/admin' },
        { icon: Search, label: 'Student Search', path: '/admin/search' },
        { icon: Upload, label: 'Manage Competitions', path: '/admin/upload' },
        { icon: Sparkles, label: 'Discovery Review', path: '/admin/discovery' },
        { icon: Bookmark, label: 'Global Repository', path: '/admin/repository' },
        { icon: BarChart3, label: 'Dept. Performance', path: '/admin/performance' },
    ];

    return (
        <div className="flex bg-background min-h-screen font-sans transition-colors duration-200">
            <SharedSidebar menuItems={menuItems} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 ml-0 md:ml-sidebar p-4 md:p-8 w-full max-w-full overflow-x-hidden min-w-0">
                <div className="md:hidden flex items-center justify-between mb-6 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 sticky top-0 z-20">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-zinc-700 transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="bg-white/90 p-1 rounded-md">
                        <img src={logo} alt="Logo" className="h-8 object-contain" />
                    </div>
                    <div className="w-10"></div>
                </div>

                <div className="w-full">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
