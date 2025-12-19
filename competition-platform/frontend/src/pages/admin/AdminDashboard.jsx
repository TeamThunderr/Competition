// File Name: AdminDashboard.jsx
// Purpose: Main dashboard for Admin
// Written for beginner developers

import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import CreateCompetitionForm from '../../components/admin/CreateCompetitionForm';
import CompetitionList from '../../components/admin/CompetitionList';
import UserManagement from '../../components/admin/UserManagement';

const AdminDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="container mx-auto p-6 flex-grow">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
                <div className="grid lg:grid-cols-2 gap-6">
                    <div>
                        <CreateCompetitionForm />
                        <CompetitionList />
                    </div>
                    <div>
                        <UserManagement />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AdminDashboard;
