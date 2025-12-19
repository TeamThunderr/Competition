// File Name: HodDashboard.jsx
// Purpose: Main dashboard for HOD
// Written for beginner developers

import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import OverviewCards from '../../components/hod/OverviewCards';
import DepartmentSummary from '../../components/hod/DepartmentSummary';
import AnalyticsChart from '../../components/hod/AnalyticsChart';

const HodDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="container mx-auto p-6 flex-grow">
                <h1 className="text-3xl font-bold mb-6">Head of Department Dashboard</h1>
                <OverviewCards />
                <div className="grid md:grid-cols-2 gap-6">
                    <DepartmentSummary />
                    <AnalyticsChart />
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default HodDashboard;
