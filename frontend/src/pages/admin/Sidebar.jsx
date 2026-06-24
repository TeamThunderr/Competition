import React from 'react';
import { LayoutDashboard, Search, Upload, Bookmark, BarChart3 } from 'lucide-react';
import SharedSidebar from '../common/SharedSidebar';

const Sidebar = ({ isOpen, onClose }) => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'CIT Dashboard', path: '/admin' },
        { icon: Search, label: 'Student Search', path: '/admin/search' },
        { icon: Upload, label: 'Manage Competitions', path: '/admin/upload' },
        { icon: Bookmark, label: 'Global Repository', path: '/admin/repository' },
        { icon: BarChart3, label: 'Dept. Performance', path: '/admin/performance' },
    ];

    return (
        <SharedSidebar
            menuItems={menuItems}
            isOpen={isOpen}
            onClose={onClose}
        />
    );
};

export default Sidebar;
