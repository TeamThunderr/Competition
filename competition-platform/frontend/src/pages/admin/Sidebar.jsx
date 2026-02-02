import React, { useState } from 'react';
import { LayoutDashboard, Search, Upload, Bookmark, BarChart3, Menu, X } from 'lucide-react';
import SharedSidebar from '../common/SharedSidebar';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { icon: LayoutDashboard, label: 'CIT Dashboard', path: '/admin' },
        { icon: Search, label: 'Student Search', path: '/admin/search' },
        { icon: Upload, label: 'Manage Competitions', path: '/admin/upload' },
        { icon: Bookmark, label: 'Global Repository', path: '/admin/repository' },
        { icon: BarChart3, label: 'Dept. Performance', path: '/admin/performance' },
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-md shadow-md text-gray-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                aria-label="Toggle Menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <SharedSidebar
                menuItems={menuItems}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
};

export default Sidebar;
