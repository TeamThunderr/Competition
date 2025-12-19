// File Name: StudentDashboard.jsx
// Purpose: Main dashboard for Student role
// Written for beginner developers

import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import CompetitionCard from '../../components/student/CompetitionCard';

const mockCompetitions = [
    { id: 1, title: 'Hackathon 2024', description: 'Coding challenge', date: '2024-12-25', status: 'Open' },
    { id: 2, title: 'Robotics Meet', description: 'Build robots', date: '2025-01-10', status: 'Upcoming' },
];

const StudentDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="container mx-auto p-6 flex-grow">
                <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Active Competitions</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockCompetitions.map(comp => (
                            <CompetitionCard key={comp.id} competition={comp} />
                        ))}
                    </div>
                </section>
            </div>
            <Footer />
        </div>
    );
};

export default StudentDashboard;
