import React, { useState, useEffect } from 'react';
import HodSidebar from './Sidebar';
import {
    Users, Award, BookOpen, UserCheck, AlertCircle,
    BarChart2, PieChart, TrendingUp, Menu
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, Legend
} from 'recharts';
import { getDashboardAnalysis } from '../../services/usersService';
import logo from '../../assets/logo.png';

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

    if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <HodSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 overflow-x-hidden">
                {/* Mobile Header with Menu Button */}
                <div className="md:hidden flex items-center justify-between mb-6">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <img src={logo} alt="Logo" className="h-8 object-contain mix-blend-multiply" />
                    <div className="w-10"></div>
                </div>

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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* 2. Chart (Only show comparative chart in Overview, hide or specific chart for batch) */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">
                                {activeTab === 'Overview' ? 'Batch Distribution' : 'Batch Performance'}
                            </h3>
                        </div>
                        <div className="w-full h-[300px] min-h-[300px]">
                            {/* Render chart only if data exists to prevent dimension errors */}
                            {(activeTab === 'Overview' ? data.batchStats : filteredOverview).length > 0 ? (
                                <ResponsiveContainer width="99%" height="100%">
                                    <BarChart
                                        data={activeTab === 'Overview' ? data.batchStats : filteredOverview}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey={activeTab === 'Overview' ? "name" : "batch"} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <Tooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey={activeTab === 'Overview' ? "students" : "total"} name="Count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                                    No chart data available for this view
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Academic Stats (Filtered) */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            {activeTab === 'Overview' ? 'Academic Performance Summary' : `${activeTab} Year Performance`}
                        </h3>
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
                                    {data.academicStats
                                        .filter(year => activeTab === 'Overview' || year.year === `${activeTab} Year`)
                                        .map((year) => (
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

            </div>
        </div>
    );
};
export default HodAnalytics;
