import React, { useState, useEffect } from 'react';
import HodSidebar from './Sidebar';
import {
    Users, Award, BookOpen, UserCheck, AlertCircle,
    BarChart2, PieChart, TrendingUp
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, Legend
} from 'recharts';
import { getDashboardAnalysis } from '../../services/usersService';

const Card = ({ title, value, subtext, icon: Icon, color }) => (
    <div className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 ${color}`}>
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
            <div className={`p-2 rounded-lg bg-gray-50 text-gray-400`}>
                <Icon size={18} />
            </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <p className="text-xs text-gray-400">{subtext}</p>
    </div>
);

const HodAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        summary: { totalStudents: 0, totalFaculty: 0, totalCompetitions: 0, verifiedSubmissions: 0 },
        batchStats: [],
        academicStats: [],
        competitionOverview: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getDashboardAnalysis();
                if (res) setData(res);
            } catch (error) {
                console.error("Failed to fetch analysis", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <HodSidebar />

            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Department Analysis</h1>
                    <p className="text-gray-500 mt-1">
                        Analytics for 2nd, 3rd, and 4th Year Students (1st Year Excluded)
                    </p>
                </div>

                {/* 1. Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card
                        title="Eligible Students"
                        value={data.summary.totalStudents}
                        subtext="Excluding 1st Year"
                        icon={Users}
                        color="border-blue-500"
                    />
                    <Card
                        title="Total Faculty"
                        value={data.summary.totalFaculty}
                        subtext="Active Staff"
                        icon={BookOpen}
                        color="border-indigo-500"
                    />
                    <Card
                        title="Total Participations"
                        value={data.summary.totalCompetitions}
                        subtext="Registered Events"
                        icon={TrendingUp}
                        color="border-purple-500"
                    />
                    <Card
                        title="Verified Wins/Entries"
                        value={data.summary.verifiedSubmissions}
                        subtext="Faculty Verified"
                        icon={UserCheck}
                        color="border-green-500"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* 2. Batch Wise Distribution Chart */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Student Distribution (By Batch)</h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.batchStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="students" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Academic Performance Table */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Academic Performance (Avg CGPA)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                                        <th className="pb-3">Year</th>
                                        <th className="pb-3 text-center">Student Count</th>
                                        <th className="pb-3 text-right">Avg CGPA</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-gray-50">
                                    {data.academicStats.map((year) => (
                                        <tr key={year.year} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 font-medium text-gray-900">{year.year}</td>
                                            <td className="py-3 text-center text-gray-600">{year.count}</td>
                                            <td className="py-3 text-right">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${year.avgCgpa !== 'N/A' && parseFloat(year.avgCgpa) >= 8.0 ? 'bg-green-50 text-green-700' :
                                                    year.avgCgpa !== 'N/A' && parseFloat(year.avgCgpa) >= 7.0 ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {year.avgCgpa}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.academicStats.length === 0 && (
                                        <tr><td colSpan="3" className="py-4 text-center text-gray-400">No data found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 4. Competition Participation Overview */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Competition Participation by Batch</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                                    <th className="pb-3">Batch</th>
                                    <th className="pb-3 text-center">Total Participations</th>
                                    <th className="pb-3 text-center text-green-600">Verified</th>
                                    <th className="pb-3 text-center text-yellow-600">Pending</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-50">
                                {data.competitionOverview?.map((batch) => (
                                    <tr key={batch.batch} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 font-medium text-gray-900">{batch.batch}</td>
                                        <td className="py-4 text-center font-bold text-blue-600">{batch.total}</td>
                                        <td className="py-4 text-center text-green-600">{batch.verified}</td>
                                        <td className="py-4 text-center text-yellow-600">{batch.pending}</td>
                                    </tr>
                                ))}
                                {(!data.competitionOverview || data.competitionOverview.length === 0) && (
                                    <tr><td colSpan="4" className="py-8 text-center text-gray-400">No participation data available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};
export default HodAnalytics;
