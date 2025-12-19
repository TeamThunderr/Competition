// File Name: FacultyDashboard.jsx
// Purpose: Main dashboard for Faculty
// Written for beginner developers

import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import DepartmentStats from '../../components/faculty/DepartmentStats';
import StudentList from '../../components/faculty/StudentList';
import ParticipationTable from '../../components/faculty/ParticipationTable';

const FacultyDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="container mx-auto p-6 flex-grow">
                <h1 className="text-3xl font-bold mb-6">Faculty Dashboard</h1>
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <DepartmentStats />
                        <ParticipationTable />
                    </div>
                    <div>
                        <StudentList />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default FacultyDashboard;
