import React from 'react';
import { LayoutDashboard, Globe, User, BarChart2 } from 'lucide-react';
import SharedSidebar from '../common/SharedSidebar';

const StudentSidebar = ({ isOpen, onClose }) => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
        { icon: Globe, label: 'Competitions', path: '/student/competitions' },
        { icon: User, label: 'Profile', path: '/student/profile' },

        // Settings was in the original file imports but not used in menuItems loop in original file? 
        // Original menuItems: Dashboard, Comp, Profile, Analytics. 
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
