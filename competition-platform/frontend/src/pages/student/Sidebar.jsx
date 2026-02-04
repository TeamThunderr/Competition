import React from 'react';
import { LayoutDashboard, Globe, User, BarChart2, FileText } from 'lucide-react';
import SharedSidebar from '../common/SharedSidebar';

const StudentSidebar = ({ isOpen, onClose }) => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
        { icon: Globe, label: 'Competitions', path: '/student/competitions' },
        { icon: User, label: 'Profile', path: '/student/profile' },
        { icon: BarChart2, label: 'Analytics', path: '/student/stats' },
        { icon: FileText, label: 'OD History', path: '/student/od-history' },
    ];

    return (
        <SharedSidebar
            menuItems={menuItems}
            isOpen={isOpen}
            onClose={onClose}
        />
    );
};

export default StudentSidebar;
