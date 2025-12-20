import React, { useEffect, useState } from 'react';
import CompetitionCard from '../../components/CompetitionCard';

const StudentDashboard = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/competitions');
                if (response.ok) {
                    const data = await response.json();
                    setCompetitions(data);
                } else {
                    console.error('Failed to fetch competitions');
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompetitions();
    }, []);

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Dashboard</h1>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Upcoming Competitions</h2>

                {loading ? (
                    <div className="text-gray-500">Loading events...</div>
                ) : competitions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {competitions.map(comp => (
                            <CompetitionCard
                                key={comp.id}
                                competition={comp}
                                showRegister={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 bg-white p-8 rounded-lg border text-center">
                        No competitions active at the moment.
                    </div>
                )}
            </section>
        </div>
    );
};

export default StudentDashboard;
