import React, { useState, useEffect } from 'react';
import HodLayout from './HodLayout';
import {
    Users, Award, BookOpen, UserCheck, AlertCircle,
    BarChart2, PieChart, TrendingUp, TrendingDown
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, Legend, LineChart, Line
} from 'recharts';
import { getDashboardAnalysis } from '../../services/hodService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

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
    const [activeTab, setActiveTab] = useState('Overview'); // Overview, 2nd, 3rd, 4th
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

    // Safe Filter Logic
    const getTabContent = () => {
        const overview = data.competitionOverview || [];
        if (activeTab === 'Overview') return overview;
        return overview.filter(item => item.academicYear === `${activeTab} Year`);
    };

    const getStatsForTab = () => {
        const summary = data.summary || { totalStudents: 0, totalFaculty: 0, totalCompetitions: 0, verifiedSubmissions: 0 };
        if (activeTab === 'Overview') return summary;

        const overview = data.competitionOverview || [];
        const academic = data.academicStats || [];

        // Calculate specific stats for the batch
        const batchData = overview.find(item => item.academicYear === `${activeTab} Year`);
        const studentData = academic.find(item => item.year === `${activeTab} Year`);

        return {
            totalStudents: studentData?.count || 0,
            totalFaculty: summary.totalFaculty,
            totalCompetitions: batchData?.total || 0,
            verifiedSubmissions: batchData?.verified || 0
        };
    };

    const currentStats = getStatsForTab();
    const filteredOverview = getTabContent();

    if (loading) {
        return (
            <div className="flex bg-gray-50 min-h-screen items-center justify-center">
                <RoleBasedLoader role="HOD" />
            </div>
        );
    }

    return (
        <HodLayout>
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {activeTab === 'Overview' ? 'Department Overview' : `${activeTab} Year Analytics`}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {activeTab === 'Overview'
                            ? 'Summary of 2nd, 3rd, and 4th Years'
                            : `Focused view for ${activeTab} Year Batch`}
                    </p>
                </div>

                {/* Simplified Tabs */}
                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto overflow-x-auto">
                    <div className="flex space-x-1 min-w-full md:min-w-0">
                        {['Overview', '2nd', '3rd', '4th'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex-1 md:flex-none ${activeTab === tab
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {tab === 'Overview' ? 'Overview' : `${tab} Year`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 1. Dynamic Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card
                    title={activeTab === 'Overview' ? "Total Eligible Students" : `${activeTab} Year Students`}
                    value={currentStats.totalStudents}
                    subtext={activeTab === 'Overview' ? "Excl. 1st Year" : "Active Batch Count"}
                    icon={Users}
                    color="border-blue-500"
                />
                <Card
                    title="Dept Faculty"
                    value={data.summary.totalFaculty}
                    subtext="Active Staff"
                    icon={BookOpen}
                    color="border-indigo-500"
                />
                <Card
                    title="Competitions Entered"
                    value={currentStats.totalCompetitions}
                    subtext="Registrations"
                    icon={TrendingUp}
                    color="border-purple-500"
                />
                <Card
                    title="Verified Wins/Entries"
                    value={currentStats.verifiedSubmissions}
                    subtext="Faculty Verified"
                    icon={UserCheck}
                    color="border-green-500"
                />
            </div>

            {/* 2. Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Participation Trend (Line Chart) */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Participation Trends (Last 6 Months)</h3>
                    <div className="w-full h-[300px] min-h-[300px]">
                        <ResponsiveContainer width="99%" height="100%">
                            <LineChart data={data.participationTrend || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Competitions (Horizontal Bar Chart) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Competitions by Participation</h3>
                    <div className="w-full h-[300px] min-h-[300px]">
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart layout="vertical" data={data.topCompetitions || []} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#F9FAFB' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="students" name="Participants" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. Detailed Stats Grid (ROI & Risk) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* ROI Table */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Engagement ROI</h3>
                    <p className="text-sm text-gray-500 mb-4">Analysis of participation vs winners</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Participants</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Winners</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Conversion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(data.roi || []).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.format}</td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600">{row.participants}</td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600">{row.winners}</td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${parseFloat(row.roi) > 15 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {row.roi}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!data.roi || data.roi.length === 0) && (
                                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400">No ROI data calculated yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* At Risk Students */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm border-l-4 border-l-red-400">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">At-Risk Students</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Zero participation in current semester</p>
                        </div>
                        <AlertCircle className="text-red-400" />
                    </div>

                    <div className="overflow-y-auto max-h-[300px] pr-2">
                        {(!data.atRiskStudents || data.atRiskStudents.length === 0) ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                                <UserCheck size={32} className="mb-2 text-green-400 opacity-50" />
                                <span>Good job! No students flagged as 'At Risk'.</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.atRiskStudents.map((student, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-50 dark:border-red-900/30 hover:border-red-100 dark:hover:border-red-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-foreground">{student.name}</div>
                                                <div className="text-xs text-muted">{student.regNo} • {student.year} Yr</div>
                                            </div>
                                        </div>
                                        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">View</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border dark:border-slate-700 text-center">
                        <button className="text-sm text-muted hover:text-foreground font-medium">View All Metrics</button>
                    </div>
                </div>
            </div>

            {/* 4. Competition Participation Details for Selected Batch */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {activeTab === 'Overview' ? 'All Batches Participation' : `${activeTab} Year Participation Breakdown`}
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                                <th className="pb-3 pl-2">Batch / Year</th>
                                <th className="pb-3 text-center px-2">Total Participations</th>
                                <th className="pb-3 text-center text-green-600 px-4">Verified</th>
                                <th className="pb-3 text-center text-yellow-600 px-2">Pending</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-50">
                            {filteredOverview.map((batch) => (
                                <tr key={batch.batch} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 font-medium text-gray-900">
                                        {batch.batch} <span className="text-gray-400 text-xs ml-2">({batch.academicYear})</span>
                                    </td>
                                    <td className="py-4 text-center font-bold text-blue-600">{batch.total}</td>
                                    <td className="py-4 text-center text-green-600">{batch.verified}</td>
                                    <td className="py-4 text-center text-yellow-600">{batch.pending}</td>
                                </tr>
                            ))}
                            {filteredOverview.length === 0 && (
                                <tr><td colSpan="4" className="py-8 text-center text-gray-400">No participation data available for this selection.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </HodLayout>
    );
};

export default HodAnalytics;
