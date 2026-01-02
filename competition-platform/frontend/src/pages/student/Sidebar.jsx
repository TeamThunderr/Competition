import React from 'react';
import { LayoutDashboard, Globe, FileText, Settings, User } from 'lucide-react';
import SharedSidebar from '../common/SharedSidebar';

const StudentSidebar = () => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
        { icon: Globe, label: 'Competitions', path: '/student/competitions' },
        { icon: User, label: 'Profile', path: '/student/profile' },
        { icon: BarChart2, label: 'Analytics', path: '/student/stats' },
    ];

    return <SharedSidebar menuItems={menuItems} />;
};

export default StudentSidebar;
