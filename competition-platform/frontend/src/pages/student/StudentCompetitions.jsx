// File Name: StudentCompetitions.jsx
// Purpose: List of all competitions for students
// Written for beginner developers

import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const StudentCompetitions = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="container mx-auto p-6 flex-grow">
                <h1 className="text-2xl font-bold mb-4">All Competitions</h1>
                <p>List of all available competitions will go here.</p>
                {/* Reuse CompetitionCard and map through data */}
            </div>
            <Footer />
        </div>
    );
};

export default StudentCompetitions;
