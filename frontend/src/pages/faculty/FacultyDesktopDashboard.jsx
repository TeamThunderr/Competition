import React, { useEffect, useState } from 'react';
import { Menu, RefreshCw, Download } from 'lucide-react';

import { getDashboardStats } from '../../services/facultyService';
import { api } from '../../services/api';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { useSync } from '../../context/SyncContext';

const FacultyDesktopDashboard = () => {
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
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const { isGlobalSyncing, setIsGlobalSyncing, syncProgressMap, fetchSyncStatus } = useSync();
    const { addToast } = useToast();
    
    // Find any active progress message to display on the global button
    const activeProgress = Object.values(syncProgressMap)[0];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsData, competitionsData] = await Promise.all([
                    getDashboardStats(),
                    api.get('/api/faculty/competitions')
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
        { label: 'COMP. WON', value: stats.comp_won, subtext: 'Competition Winners' },
    ];

    return (
        <>
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground hidden md:block">Section Mentor Dashboard</h1>
                        <div className="flex items-center gap-2 text-muted mt-2 text-sm">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                                {statsCards.map((stat, index) => (
                                    <div key={index} className="bg-card p-6 rounded-xl border border-border shadow-sm transition-shadow hover:shadow-md">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{stat.label}</h3>
                                        <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                                        <div className="text-xs text-gray-400">{stat.subtext}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Active Competitions Section */}
                            <div>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Active Competitions</h2>
                                        <p className="text-muted mt-1">Ongoing and upcoming events available for students.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsSyncModalOpen(true)}
                                            disabled={isGlobalSyncing}
                                            className={`flex flex-col items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all min-w-[140px] ${
                                                isGlobalSyncing
                                                    ? 'bg-gray-300 text-gray-700 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-400'
                                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <RefreshCw size={18} className={isGlobalSyncing ? "animate-spin" : ""} /> 
                                                {isGlobalSyncing ? 'Syncing...' : 'Sync Comp'}
                                            </div>
                                            {isGlobalSyncing && activeProgress && (
                                                <span className="text-[10px] font-normal opacity-80 mt-1 max-w-[120px] truncate" title={activeProgress}>
                                                    {activeProgress}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {competitions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                    <div className="bg-card rounded-xl border border-border p-12 text-center">
                                        <div className="text-4xl mb-4">🔍</div>
                                        <h3 className="text-lg font-medium text-foreground">No active competitions</h3>
                                        <p className="text-muted mt-1">Check back later for new events.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

            <ConfirmModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                title="Sync Active Competitions"
                message="Start background sync for all active competitions? The AI will scan emails for new registrations. This might take a few minutes."
                confirmText="Start Sync"
                loading={isGlobalSyncing}
                onConfirm={async () => {
                    try {
                        const { syncActiveCompetitions } = await import('../../services/facultyService');
                        await syncActiveCompetitions();
                        
                        // Optimistically lock the UI immediately (don't wait for next poll)
                        setIsGlobalSyncing(true);
                        
                        addToast("Sync started! The AI is scanning emails in the background.", 'info');

                        // Poll after short delay to get live progress from DB
                        setTimeout(() => fetchSyncStatus(), 800);
                        setIsSyncModalOpen(false);
                    } catch (e) {
                        console.error(e);
                        addToast("Sync Failed: " + (e.response?.data?.error || e.message || "Unknown error"), 'error');
                        setIsSyncModalOpen(false);
                    }
                }}
            />
        </>
    );
};

export default FacultyDesktopDashboard;