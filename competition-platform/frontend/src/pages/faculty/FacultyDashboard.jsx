import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { getDashboardStats } from '../../services/facultyService';
import { api } from '../../services/api';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const FacultyDashboard = () => {
    const [stats, setStats] = useState({
        total_students: 0,
        comp_registered: 0,
        comp_qualified: 0,
        od_requests: 0,
        section_label: 'Loading...',
        batch_label: '...'
    });
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsData, competitionsData] = await Promise.all([
                    getDashboardStats(),
                    api.get('/api/competitions')
                ]);

                setStats(statsData);
                // Handle standardized response wrapper
                const comps = Array.isArray(competitionsData) ? competitionsData : (competitionsData.data || []);
                setCompetitions(comps);
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
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 md:ml-64">
                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center gap-4 sticky top-0 z-20">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg">Mentor Dashboard</span>
                </div>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 hidden md:block">Section Mentor Dashboard</h1>
                        <div className="flex items-center gap-2 text-gray-600 mt-2 text-sm">
                            <span>Class {stats.section_label}</span>
                            <span>|</span>
                            <span>Batch : </span>
                            <span className="text-blue-600 font-medium">{stats.batch_label}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <RoleBasedLoader role="FACULTY" />
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
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Active Competitions</h2>
                                        <p className="text-gray-500 mt-1">Ongoing and upcoming events available for students.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={async () => {
                                                if (confirm("Sync ALL active competitions? This will check registration status for all students against the database.")) {
                                                    setLoading(true);
                                                    try {
                                                        const { syncCompetition } = await import('../../services/facultyService');
                                                        const { getDashboardStats } = await import('../../services/facultyService');

                                                        let processedCount = 0;
                                                        // Sync each competition sequentially
                                                        for (const comp of competitions) {
                                                            await syncCompetition(comp.id);
                                                            processedCount++;
                                                        }

                                                        alert(`Sync Complete! Synced ${processedCount} active competitions.`);

                                                        // Refresh Stats
                                                        const newStats = await getDashboardStats();
                                                        setStats(newStats);

                                                        // Refresh Competitions (to update counts/status)
                                                        const activeCompetitionsResponse = await api.get('/api/competitions');
                                                        const activeCompetitions = (activeCompetitionsResponse?.success && Array.isArray(activeCompetitionsResponse.data))
                                                            ? activeCompetitionsResponse.data
                                                            : (Array.isArray(activeCompetitionsResponse) ? activeCompetitionsResponse : []);

                                                        setCompetitions(activeCompetitions);
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert("Sync Failed: " + (e.message || "Unknown Error"));
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                            }}
                                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            🔄 Sync Comp
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const { downloadParticipationReport } = await import('../../services/facultyService');
                                                    await downloadParticipationReport();
                                                } catch (e) {
                                                    alert("Download failed");
                                                }
                                            }}
                                            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                                        >
                                            📥 Download
                                        </button>
                                    </div>
                                </div>

                                {competitions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {competitions
                                            .filter(comp => new Date(comp.registration_deadline) >= new Date())
                                            .map(comp => (
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
        </div>
    );
};

export default FacultyDashboard;