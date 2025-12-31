import React from 'react';
import { LayoutDashboard, CheckCircle, BarChart2, Briefcase, Users } from 'lucide-react';
import SharedSidebar from '../common/SharedSidebar';

const HodSidebar = () => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dept. Dashboard', path: '/hod' },
        { icon: Users, label: 'Faculty Directory', path: '/hod/faculty' },
        { icon: CheckCircle, label: 'OD Approvals', path: '/hod/approvals' },
        { icon: BarChart2, label: 'Analytics', path: '/hod/analytics' },
        { icon: Briefcase, label: 'All Competitions', path: '/hod/competitions' },
    ];

    return <SharedSidebar menuItems={menuItems} />;
};

export default HodSidebar;
