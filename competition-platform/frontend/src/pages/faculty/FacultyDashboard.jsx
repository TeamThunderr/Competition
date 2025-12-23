import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { getFacultyDashboardStats } from '../../services/usersService';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';

const FacultyDashboard = () => {
    const [stats, setStats] = useState({
        total_students: 0,
        comp_registered: 0,
        comp_qualified: 0,
        od_requests: 0,
        section_label: 'Loading...'
    });
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsData, competitionsResponse] = await Promise.all([
                    getFacultyDashboardStats(),
                    fetch('http://localhost:5000/api/competitions')
                ]);

                setStats(statsData);

                if (competitionsResponse.ok) {
                    const competitionsData = await competitionsResponse.json();
                    setCompetitions(competitionsData);
                }
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Stats Cards Data mapped from backend
    const statsCards = [
        { label: 'TOTAL STUDENTS', value: stats.total_students, subtext: `Class ${stats.section_label}` },
        { label: 'COMP. REGISTERED', value: stats.comp_registered, subtext: 'Active Participations' },
        { label: 'COMP. QUALIFIED', value: stats.comp_qualified, subtext: 'Round 1 Cleared' },
        { label: 'OD REQUESTS', value: stats.od_requests, subtext: 'Pending Coordinator' },
    ];

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
            <Sidebar />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Section Mentor Dashboard</h1>
                    <div className="flex items-center gap-2 text-gray-600 mt-2 text-sm">
                        <span>Class {stats.section_label}</span>
                        <span>|</span>
                        <span>Batch 2024-2028</span>
                        <span>|</span>
                        <span className="text-blue-600 font-medium">Read-Only Mode</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {statsCards.map((stat, index) => (
                                <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{stat.label}</h3>
                                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                                    <div className="text-xs text-gray-400">{stat.subtext}</div>
                                </div>
                            ))}
                        </div>

                        {/* Active Competitions Section */}
                        <div>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Active Competitions</h2>
                                <p className="text-gray-500 mt-1">Ongoing and upcoming events available for students.</p>
                            </div>

                            {competitions.length > 0 ? (
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
                                    <h3 className="text-lg font-medium text-gray-900">No active competitions</h3>
                                    <p className="text-gray-500 mt-1">Check back later for new events.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default FacultyDashboard;