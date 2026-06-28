import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import FacultyDesktopDashboard from './FacultyDesktopDashboard';
import FacultyMobileDashboard from './FacultyMobileDashboard';

const FacultyDashboard = () => {
    const isMobile = useIsMobile(768);

    if (isMobile) {
        return <FacultyMobileDashboard />;
    }

    return <FacultyDesktopDashboard />;
};

export default FacultyDashboard;