import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Upload, X, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';
import EditCompetitionModal from '../../components/admin/EditCompetitionModal';
import { useToast } from '../../contexts/ToastContext';

const AdminDashboard = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeCompetitions: 0,
        totalParticipation: "0",
        lastSync: "00:00",
        closingSoonCount: 0
    });

    const [competitions, setCompetitions] = useState([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedCompetition, setSelectedCompetition] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, competition: null });

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Department Stats
            const json = await api.get('/api/admin/stats');
            let totalVerified = 0;

            if (json.success && json.data) {
                const allDepts = json.data;
                totalVerified = allDepts.reduce((sum, dept) => sum + (dept.verified_registrations || 0), 0);
            } else if (Array.isArray(json)) {
                totalVerified = json.reduce((sum, dept) => sum + (dept.verified_registrations || 0), 0);
            }

            // 2. Fetch All Competitions
            const compRes = await api.get('/api/competitions');
            const comps = compRes?.data || (Array.isArray(compRes) ? compRes : []);

            let activeCount = 0;
            let closingSoon = 0;

            if (comps) {
                const now = new Date();

                // Filter active competitions
                const activeComps = comps.filter(c => {
                    if (!c.registration_deadline) return false;
                    const deadline = new Date(c.registration_deadline);
                    const isValid = !isNaN(deadline.getTime()) && deadline > now;

                    if (isValid) {
                        // Check urgency: closing within 7 days
                        const diffTime = Math.abs(deadline - now);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays <= 7) closingSoon++;
                    }
                    return isValid;
                });

                activeCount = activeComps.length;

                // Sort by upload time (newest first) for admin view
                const sortedComps = [...comps].sort((a, b) =>
                    new Date(b.created_at || 0) - new Date(a.created_at || 0)
                );
                setCompetitions(sortedComps);
            }

            setStats({
                activeCompetitions: activeCount,
                totalParticipation: totalVerified.toString(),
                lastSync: new Date().toLocaleTimeString(),
                closingSoonCount: closingSoon
            });

        } catch (err) {
            console.error("Fetch Stats Error:", err);
            addToast('Failed to fetch dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleRefresh = () => {
        setLoading(true);
        fetchDashboardData();
    };

    const handleEdit = (competition) => {
        setSelectedCompetition(competition);
        setEditModalOpen(true);
    };

    const handleDeleteClick = (competition) => {
        setDeleteConfirmation({ open: true, competition });
    };

    const handleDeleteConfirm = async () => {
        const { competition } = deleteConfirmation;
        setDeleteConfirmation({ open: false, competition: null });

        try {
            const response = await api.del(`/api/admin/competition/${competition.id}`);

            if (response.success !== false) {
                addToast('Competition deleted successfully', 'success');
                fetchDashboardData();
            } else {
                addToast(response.message || 'Failed to delete competition', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            addToast('Failed to delete competition', 'error');
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmation({ open: false, competition: null });
    };

    const handleModalClose = () => {
        setEditModalOpen(false);
        setSelectedCompetition(null);
    };

    const handleCompetitionUpdate = (updatedCompetition) => {
        addToast('Competition updated successfully', 'success');
        fetchDashboardData();
        handleModalClose();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <RoleBasedLoader role="ADMIN" />
            </div>
        );
    }

    return (
        <>
                <div className="w-[95%] mx-auto pt-16 md:pt-8 min-w-0">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-foreground">CHENNAI INSTITUTE OF TECHNOLOGY (CIT)</h1>
                        <p className="text-muted mt-1">College-wide Competition Management & Analytics Console.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {/* Active Competitions */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Active Competitions (Accepting Entries)</h3>
                            <div className="text-3xl font-bold text-foreground mb-2">{stats.activeCompetitions}</div>
                            {stats.closingSoonCount > 0 && (
                                <div className="text-xs text-red-600 font-medium bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded inline-block">
                                    {stats.closingSoonCount} closing this week
                                </div>
                            )}
                        </div>

                        {/* Total Participation */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Total Student Registrations</h3>
                            <div className="text-3xl font-bold text-foreground mb-4">{stats.totalParticipation}</div>
                            <div className="text-xs text-muted">Across 8 Departments</div>
                        </div>

                        {/* Last Data Sync */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Last Data Sync</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="text-xl font-bold text-foreground">{stats.lastSync}</div>
                                <span className="flex items-center text-xs text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                                    Synced
                                </span>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline"
                            >
                                Force Refresh
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-6 flex gap-3">
                        <Link
                            to="/admin/upload"
                            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Upload size={20} />
                            Upload Competition
                        </Link>
                        <Link
                            to="/admin/repository"
                            className="bg-card border border-border text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-muted/10 transition-colors"
                        >
                            View Repository
                        </Link>
                    </div>

                    {/* Competitions Grid */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-foreground">All Competitions</h2>
                            <span className="text-sm text-muted">Sorted by upload time (newest first)</span>
                        </div>
                        {competitions.length === 0 ? (
                            <div className="bg-card rounded-xl border border-border p-12 text-center">
                                <p className="text-muted">No competitions found. Upload your first competition to get started.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {competitions.map((comp) => (
                                    <div key={comp.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col relative group">
                                        {/* Competition Info */}
                                        <div className="p-6 flex-1">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                                                    {comp.platform || 'Unknown Platform'}
                                                </span>
                                                <span className="text-xs text-muted">
                                                    {comp.created_at ? new Date(comp.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    }) : 'N/A'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">{comp.title || 'Untitled Competition'}</h3>
                                            <p className="text-sm text-muted mb-4 line-clamp-2">{comp.description}</p>

                                            <div className="space-y-2 text-xs text-muted">
                                                <div>Deadline: {comp.registration_deadline ? new Date(comp.registration_deadline).toLocaleDateString() : 'TBA'}</div>
                                                <div>Registrations: {comp.registrations?.[0]?.count || 0}</div>
                                            </div>
                                        </div>

                                        {/* Hover Overlay - View Details */}
                                        <Link
                                            to={`/competitions/${comp.id}`}
                                            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                        >
                                            <div className="bg-white dark:bg-card px-6 py-3 rounded-lg shadow-lg border border-border flex items-center gap-2 transform hover:scale-105 transition-transform">
                                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                <span className="font-semibold text-foreground">View Details</span>
                                            </div>
                                        </Link>

                                        {/* Action Buttons */}
                                        <div className="border-t border-border p-4 flex gap-2 relative z-20">
                                            <button
                                                onClick={() => handleEdit(comp)}
                                                className="flex-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Pencil size={14} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(comp)}
                                                className="flex-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            {/* Edit Competition Modal */}
            {editModalOpen && selectedCompetition && (
                <EditCompetitionModal
                    competition={selectedCompetition}
                    isOpen={editModalOpen}
                    onClose={handleModalClose}
                    onUpdate={handleCompetitionUpdate}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirmation.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-foreground mb-1">Delete Competition</h3>
                                <p className="text-sm text-muted">
                                    Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteConfirmation.competition?.title}"</span>?
                                </p>
                                <p className="text-xs text-muted mt-2">
                                    This will permanently remove the competition and all related data. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleDeleteCancel}
                                className="px-4 py-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminDashboard;
