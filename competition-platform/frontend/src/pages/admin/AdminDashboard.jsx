import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import supabase from '../../services/supabaseClient';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        activeCompetitions: 0,
        totalParticipation: "0",
        lastSync: "Never"
    });

    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const headers = { 'x-user-id': session?.user?.id };

                // Fetch Stats
                const response = await fetch('http://localhost:5000/api/admin/stats', { headers });

                if (response.ok) {
                    const json = await response.json();
                    if (json.success && json.data) {
                        const allDepts = json.data;
                        // Aggregate verified registrations
                        const totalVerified = allDepts.reduce((sum, dept) => sum + (dept.verified_registrations || 0), 0);

                        setStats({
                            activeCompetitions: 12, // Placeholder until competition count endpoint
                            totalParticipation: totalVerified.toString(),
                            lastSync: new Date().toLocaleTimeString()
                        });
                    }
                }
            } catch (err) {
                console.error("Fetch Stats Error:", err);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Central IQ Team (CIT)</h1>
                    <p className="text-gray-500 mt-1">College-wide Competition Management & Analytics Console.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Active Competitions */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Competitions</h3>
                        <div className="text-3xl font-bold text-gray-900 mb-4">{stats.activeCompetitions}</div>
                        <div className="flex gap-2">
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-medium">12 Ongoing</span>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">12 Upcoming</span>
                        </div>
                    </div>

                    {/* Total Participation */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Participation</h3>
                        <div className="text-3xl font-bold text-gray-900 mb-4">{stats.totalParticipation}</div>
                        <div className="text-xs text-gray-400">Across 8 Departments</div>
                    </div>

                    {/* Last Data Sync */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Last Data Sync</h3>
                        <div className="text-xl font-bold text-gray-900 mb-4">{stats.lastSync}</div>
                        <button className="text-blue-600 text-xs font-semibold hover:underline">Force Refresh</button>
                    </div>
                </div>

                {/* Content Grid (Action + Feed) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Manage Competitions Action Card */}
                    <div className="lg:col-span-2 bg-blue-600 rounded-xl p-8 text-white relative overflow-hidden shadow-lg">
                        {/* Background Pattern Hint */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-3">Manage Competitions</h2>
                            <p className="text-blue-100 mb-8 max-w-md">
                                Upload new competition details via Excel or manually add upcoming events to the global repository.
                            </p>
                            <Link to="/admin/upload" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-sm inline-flex">
                                <Upload size={20} />
                                Launch Upload Panel
                            </Link>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Recent System Activity</h3>
                        <div className="space-y-6">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                                    <p className="text-sm text-gray-800 font-medium mb-1">{activity.message}</p>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-blue-600 font-medium">{activity.user}</span>
                                        <span className="text-gray-400">{activity.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
