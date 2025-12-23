import React, { useEffect, useState } from 'react';
import { Bell, Clock, Activity, Download } from 'lucide-react';
import Sidebar from './Sidebar';
import { getFacultyDashboardStats, getRecentRegistrations } from '../../services/usersService';


const FacultyDashboard = () => {
    const [stats, setStats] = useState({
        total_students: 0,
        comp_registered: 0,
        comp_qualified: 0,
        od_requests: 0,
        section_label: 'Loading...'
    });
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsData, regsData] = await Promise.all([
                    getFacultyDashboardStats(),
                    getRecentRegistrations()
                ]);
                setStats(statsData);
                setRegistrations(regsData);
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {statsCards.map((stat, index) => (
                                <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{stat.label}</h3>
                                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                                    <div className="text-xs text-gray-400">{stat.subtext}</div>
                                </div>
                            ))}
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Column - Student Registrations (Span 2) */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Registrations Table */}
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-gray-50 flex justify-between items-start">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">Student Registrations</h2>
                                            <p className="text-sm text-gray-500 mt-1">Recent participation details</p>
                                        </div>
                                        <button className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
                                            <Download size={16} />
                                            Export Report
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50/50">
                                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <th className="px-6 py-4">Student</th>
                                                    <th className="px-6 py-4">Competition</th>
                                                    <th className="px-6 py-4">Registered At</th>
                                                    <th className="px-6 py-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {registrations.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">
                                                            No recent registrations found.
                                                        </td>
                                                    </tr>
                                                ) : registrations.map((row, index) => (
                                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <div className="font-medium text-gray-900">{row.studentName}</div>
                                                                <div className="text-xs text-gray-500">{row.regNo}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">{row.competition}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {new Date(row.registeredAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${row.status === 'Verified'
                                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                                : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                                }`}>
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>

                            {/* Right Column - Alerts & Activity (Span 1) */}
                            <div className="space-y-6">

                                {/* Actionable Alerts */}
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Bell className="text-orange-500" size={20} />
                                        <h3 className="font-bold text-gray-900">Actionable Alerts</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Placeholder Alert */}
                                        <div className="border-l-2 border-orange-200 pl-4 py-1">
                                            <p className="text-sm text-gray-800 font-medium">No urgent alerts</p>
                                            <p className="text-xs text-gray-500 mt-1">System is running smoothly</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Approaches Deadlines */}
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock className="text-red-500" size={20} />
                                        <h3 className="font-bold text-gray-900">Approaches Deadlines</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {/* Placeholder Deadline */}
                                        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">Upcoming Event</div>
                                                    <div className="text-xs text-red-600 mt-1"></div>
                                                </div>
                                                <div className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded border border-red-100">
                                                    - DAYS
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className="text-blue-500" size={20} />
                                        <h3 className="font-bold text-gray-900">Recent Activity</h3>
                                    </div>
                                    <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                        {/* Placeholder Activity */}
                                        <div className="relative pl-6">
                                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-green-500 shadow-sm"></div>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium text-gray-900">System</span> initialized for new batch
                                            </p>
                                            <div className="text-xs text-gray-400 mt-1">Just now</div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default FacultyDashboard;