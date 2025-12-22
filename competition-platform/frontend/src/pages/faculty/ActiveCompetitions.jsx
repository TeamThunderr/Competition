import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import CompetitionCard from "../../components/features/competitions/CompetitionCard";

const ActiveCompetitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/competitions');
                if (response.ok) {
                    const data = await response.json();
                    setCompetitions(data);
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
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar />

            <div className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Active Competitions</h1>
                    <p className="text-gray-500 mt-1">View current and upcoming events.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="text-gray-400">Loading events...</div>
                    </div>
                ) : competitions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {competitions.map(comp => (
                            <CompetitionCard
                                key={comp.id}
                                competition={comp}
                                showRegister={false}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                        <div className="text-4xl mb-4">🔍</div>
                        <h3 className="text-lg font-medium text-gray-900">No active competitions found</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActiveCompetitions;
