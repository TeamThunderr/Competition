import React from 'react';
import { LayoutDashboard, Globe, FileText, Settings, User } from 'lucide-react';
import SharedSidebar from '../common/SharedSidebar';

const StudentSidebar = () => {
    const menuItems = [
        { icon: Globe, label: 'Competitions', path: '/student/competitions' },
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
        { icon: User, label: 'My Profile', path: '/student/profile' },
        { icon: FileText, label: 'OD Letters', path: '/student/od-letters' },
        { icon: Settings, label: 'Settings', path: '/student/settings' },
    ];

    return <SharedSidebar menuItems={menuItems} />;
};

export default StudentSidebar;
