import React, { useEffect, useState } from 'react';
import { RefreshCw, Download, Calendar, Users, ChevronRight, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { downloadParticipationReport } from '../../services/facultyService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

const FacultyMobileDashboard = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/api/faculty/competitions');
                const comps = Array.isArray(response) ? response : (response.data || []);
                setCompetitions(comps);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
                setError("Failed to load competitions");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const activeCompetitions = competitions.filter(comp => new Date(comp.registration_deadline) >= new Date());

    return (
        <div className="pb-24">
            {/* Header & Quick Actions */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-3xl shadow-xl mb-6 mt-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <h1 className="text-2xl font-bold">Active Events</h1>
                        <p className="text-blue-100 text-sm opacity-90">Quick Access</p>
                    </div>
                    <button
                        onClick={() => setIsSyncModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 transition-all"
                    >
                        <RefreshCw size={20} className="text-blue-100" />
                        <span className="text-sm font-medium">Sync All</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="mx-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <RoleBasedLoader role="FACULTY" />
                </div>
            ) : (
                <div className="px-4">
                    <div className="flex justify-end items-center mb-4">
                        <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                            {activeCompetitions.length} Total
                        </span>
                    </div>

                    {activeCompetitions.length > 0 ? (
                        <div className="space-y-4">
                            {activeCompetitions.map(comp => (
                                <div 
                                    key={comp.id} 
                                    onClick={() => navigate(`/competitions/${comp.id}`)}
                                    className="bg-card rounded-2xl border border-border shadow-sm p-4 active:scale-[0.98] transition-transform cursor-pointer"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0">
                                            {comp.platform?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-foreground text-base truncate mb-1">{comp.title}</h3>
                                            <div className="flex items-center gap-3 text-xs text-muted">
                                                <span className="flex items-center gap-1 bg-muted/10 px-2 py-1 rounded-md">
                                                    <Calendar size={12} />
                                                    {new Date(comp.registration_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <span className="flex items-center gap-1 bg-muted/10 px-2 py-1 rounded-md">
                                                    <Users size={12} />
                                                    {comp.min_team_size === 1 && comp.max_team_size === 1 ? 'Solo' : 'Team'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center h-12 pl-2">
                                            <ChevronRight size={20} className="text-muted opacity-50" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-card rounded-2xl border border-border p-8 text-center mt-8">
                            <div className="text-4xl mb-3 opacity-50">🌱</div>
                            <h3 className="text-base font-semibold text-foreground">No active events</h3>
                            <p className="text-muted text-sm mt-1">Check back later.</p>
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                title="Sync All Active Events"
                message="This will check Gmail and databases for all active events. It may take a moment on mobile."
                confirmText="Start Sync"
                loading={syncing}
                onConfirm={async () => {
                    setSyncing(true);
                    try {
                        const { syncCompetition } = await import('../../services/facultyService');
                        let totalQueued = 0;
                        for (const comp of activeCompetitions) {
                            const result = await syncCompetition(comp.id);
                            if (result?.jobId || result?.data?.jobId) {
                                totalQueued++;
                            }
                        }
                        
                        if (totalQueued > 0) {
                            addToast(`Sync started for ${totalQueued} competition${totalQueued === 1 ? '' : 's'}.`, 'info');
                        } else {
                            addToast(`No new sync jobs were started.`, 'info');
                        }
                    } catch (e) {
                        addToast("Sync Failed: " + (e.message || "Unknown error"), 'error');
                    } finally {
                        setSyncing(false);
                        setIsSyncModalOpen(false);
                    }
                }}
            />
        </div>
    );
};

export default FacultyMobileDashboard;
