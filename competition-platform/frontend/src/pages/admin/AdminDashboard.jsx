import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeCompetitions: 0,
        totalParticipation: "0",
        lastSync: "00:00",
        lastUpload: "Never",
        closingSoonCount: 0
    });

    const [recentActivity, setRecentActivity] = useState([]);

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Department Stats using central client
            const json = await api.get('/api/admin/stats');
            let totalVerified = 0;

            if (json.success && json.data) {
                const allDepts = json.data;
                totalVerified = allDepts.reduce((sum, dept) => sum + (dept.verified_registrations || 0), 0);
            } else if (Array.isArray(json)) {
                totalVerified = json.reduce((sum, dept) => sum + (dept.verified_registrations || 0), 0);
            }

                // 2. Fetch Competitions for Active Count
                const compRes = await api.get('/api/competitions');
                const comps = compRes?.data || (Array.isArray(compRes) ? compRes : []);

                let activeCount = 0;
                let activities = [];
                let closingSoon = 0;
                let lastDate = "Never";

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

                // Activity Feed - Sort by created_at DESC to get true latest
                const sortedByNewest = [...comps].sort((a, b) =>
                    new Date(b.created_at || 0) - new Date(a.created_at || 0)
                );

                activities = sortedByNewest.slice(0, 5).map(c => ({
                    action: "Competition added",
                    target: c.title,
                    user: "System",
                    time: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'
                }));

                if (sortedByNewest.length > 0) {
                    lastDate = sortedByNewest[0]?.created_at ? new Date(sortedByNewest[0].created_at).toLocaleDateString() : "Just now";
                }
            }

            setStats({
                activeCompetitions: activeCount,
                totalParticipation: totalVerified.toString(),
                lastSync: new Date().toLocaleTimeString(),
                lastUpload: lastDate,
                closingSoonCount: closingSoon
            });

            if (activities.length > 0) {
                setRecentActivity(activities);
            }

        } catch (err) {
            console.error("Fetch Stats Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleRefresh = () => {
        setLoading(true); // Optional: show loading state briefly or just refresh
        fetchDashboardData();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <RoleBasedLoader role="ADMIN" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
                <div className="w-[95%] mx-auto">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-foreground">CHENNAI INSTITUTE OF TECHNOLOGY (CIT)</h1>
                        <p className="text-muted mt-1">College-wide Competition Management & Analytics Console.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Active Competitions */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Competitions (Accepting Entries)</h3>
                            <div className="text-3xl font-bold text-foreground mb-2">{stats.activeCompetitions}</div>
                            {stats.closingSoonCount > 0 && (
                                <div className="text-xs text-red-600 font-medium bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded inline-block">
                                    {stats.closingSoonCount} closing this week
                                </div>
                            )}
                        </div>

                        {/* Total Participation */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Student Registrations</h3>
                            <div className="text-3xl font-bold text-foreground mb-4">{stats.totalParticipation}</div>
                            <div className="text-xs text-gray-400">Across 8 Departments</div>
                        </div>

                        {/* Last Data Sync */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Last Data Sync</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="text-xl font-bold text-foreground">{stats.lastSync}</div>
                                <span className="flex items-center text-xs text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                                    Synced
                                </span>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="text-blue-600 text-xs font-semibold hover:underline"
                            >
                                Force Refresh
                            </button>
                        </div>
                    </div>

                    {/* Content Grid (Action + Feed) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Manage Competitions Action Card */}
                        <div className="lg:col-span-2 bg-brand-600 rounded-xl p-8 text-white relative overflow-hidden shadow-lg">
                            {/* Background Pattern Hint */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold mb-3">Manage Competitions</h2>
                                <p className="text-brand-100 mb-10 max-w-md">
                                    Upload new competition details via Excel or manually add upcoming events to the global repository.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <Link to="/admin/upload" className="bg-white text-brand-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-brand-50 transition-colors shadow-sm">
                                        <Upload size={20} />
                                        Launch Upload Panel
                                    </Link>
                                    <Link to="/admin/repository" className="bg-brand-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-brand-800 transition-colors border border-brand-500">
                                        View All Competitions
                                    </Link>
                                </div>
                                <p className="mt-4 text-sm text-brand-200 opacity-80">
                                    Last upload: <span className="font-mono font-medium text-white">{stats.lastUpload}</span>
                                </p>
                            </div>
                        </div>

                        {/* Activity Feed */}
                        {/* Activity Feed */}
                        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-foreground">Recent System Activity</h3>
                                <Link to="/admin/logs" className="text-brand-600 text-sm font-medium hover:underline">View all logs</Link>
                            </div>

                            <div className="space-y-6 relative">
                                {/* Timeline Line */}
                                <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-slate-700"></div>

                                {recentActivity.slice(0, 3).map((activity, index) => (
                                    <div key={index} className="relative pl-6">
                                        {/* Timeline Dot */}
                                        <div className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-brand-100 border-2 border-brand-600 rounded-full z-10"></div>

                                        <div className="mb-1">
                                            <span className="text-foreground font-medium">{activity.action}</span>
                                            <span className="text-muted mx-1">–</span>
                                            <span className="text-muted">{activity.target}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <span className="font-medium text-gray-700">{activity.user}</span>
                                            <span>·</span>
                                            <span>{activity.time}</span>
                                        </div>
                                    </div>
                                ))}

                                {recentActivity.length === 0 && (
                                    <div className="text-gray-400 text-sm text-center py-4">No recent activity</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
