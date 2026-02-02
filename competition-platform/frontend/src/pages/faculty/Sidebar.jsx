import React from 'react';
import { LayoutDashboard, Users, CheckCircle } from 'lucide-react';
import SharedSidebar from '../common/SharedSidebar';

const Sidebar = ({ isOpen, onClose }) => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Mentor Dashboard', path: '/faculty' },
        { icon: Users, label: 'Student List', path: '/faculty/students' },
        { icon: CheckCircle, label: 'Verify Proofs', path: '/faculty/verify' },
        { icon: LayoutDashboard, label: 'All Competitions', path: '/faculty/competitions' },
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
