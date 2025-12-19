// File Name: StudentProfile.jsx
// Purpose: Student profile settings
// Written for beginner developers

import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const StudentProfile = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="container mx-auto p-6 flex-grow">
                <h1 className="text-2xl font-bold mb-4">My Profile</h1>
                <div className="bg-white p-6 rounded shadow">
                    <p><strong>Name:</strong> John Doe</p>
                    <p><strong>Email:</strong> john@example.com</p>
                    <p><strong>Dept:</strong> CSE</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default StudentProfile;
