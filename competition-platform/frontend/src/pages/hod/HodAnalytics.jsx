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
    <div className={`bg-card p-6 rounded-xl border border-border shadow-sm border-l-4 ${color}`}>
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</h3>
            <div className={`p-2 rounded-lg bg-muted/10 text-muted`}>
                <Icon size={18} />
            </div>
        </div>
        <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
        <p className="text-xs text-muted/80">{subtext}</p>
    </div>
);

const HodAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('2nd'); // Overview, 2nd, 3rd, 4th
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
            <div className="flex bg-background min-h-screen items-center justify-center">
                <RoleBasedLoader role="HOD" />
            </div>
        );
    }

    return (
        <HodLayout>
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {activeTab === 'Overview' ? 'Department Overview' : `${activeTab} Year Analytics`}
                    </h1>
                    <p className="text-muted mt-1">
                        {activeTab === 'Overview'
                            ? 'Summary of 2nd, 3rd, and 4th Years'
                            : `Focused view for ${activeTab} Year Batch`}
                    </p>
                </div>

                {/* Simplified Tabs */}
                <div className="flex bg-muted/10 p-1 rounded-lg border border-border shadow-sm w-full md:w-auto overflow-x-auto">
                    <div className="flex space-x-1 min-w-full md:min-w-0">
                        {['2nd'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex-1 md:flex-none ${activeTab === tab
                                    ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'text-muted hover:text-foreground hover:bg-muted/10'
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
                {/* 2. Chart (Only show comparative chart in Overview, hide or specific chart for batch) */}
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-foreground">
                            {activeTab === 'Overview' ? 'Batch Distribution' : 'Batch Performance'}
                        </h3>
                    </div>
                </div>

                {/* Top Competitions (Horizontal Bar Chart) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Competitions by Participation</h3>
                    <div className="w-full h-[300px] min-h-[300px]">
                        {/* Render chart only if data exists to prevent dimension errors */}
                        {(activeTab === 'Overview' ? data.batchStats : filteredOverview).length > 0 ? (
                            <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                                <BarChart
                                    data={activeTab === 'Overview' ? data.batchStats : filteredOverview}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey={activeTab === 'Overview' ? "name" : "batch"} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--bg-muted-10, rgba(156, 163, 175, 0.1))' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-card p-3 border border-border shadow-lg rounded-lg">
                                                        <p className="text-foreground font-medium text-sm mb-1">{`Batch: ${label}`}</p>
                                                        <p className="text-blue-500 font-bold text-sm">
                                                            {`Count : ${payload[0].value}`}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey={activeTab === 'Overview' ? "students" : "total"} name="Count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted text-sm">
                                No chart data available for this view
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Academic Stats (Filtered) */}
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-4">
                        {activeTab === 'Overview' ? 'Academic Performance Summary' : `${activeTab} Year Performance`}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border text-xs font-semibold text-muted uppercase">
                                    <th className="pb-3">Year</th>
                                    <th className="pb-3 text-center">Student Count</th>
                                    <th className="pb-3 text-right">Avg CGPA</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-border">
                                {data.academicStats
                                    .filter(year => activeTab === 'Overview' || year.year === `${activeTab} Year`)
                                    .map((year) => (
                                        <tr key={year.year} className="hover:bg-muted/10 transition-colors">
                                            <td className="py-3 font-medium text-foreground">{year.year}</td>
                                            <td className="py-3 text-center text-muted">{year.count}</td>
                                            <td className="py-3 text-right">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${year.avgCgpa !== 'N/A' && parseFloat(year.avgCgpa) >= 8.0 ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                    year.avgCgpa !== 'N/A' && parseFloat(year.avgCgpa) >= 7.0 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-muted/20 text-muted'
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
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4">
                    {activeTab === 'Overview' ? 'All Batches Participation' : `${activeTab} Year Participation Breakdown`}
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border text-xs font-semibold text-muted uppercase">
                                <th className="pb-3 pl-2">Batch / Year</th>
                                <th className="pb-3 text-center px-2">Total Participations</th>
                                <th className="pb-3 text-center text-green-600">Verified</th>
                                <th className="pb-3 text-center text-yellow-600">Pending</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border">
                            {filteredOverview.map((batch) => (
                                <tr key={batch.batch} className="hover:bg-muted/10 transition-colors">
                                    <td className="py-4 font-medium text-foreground">
                                        {batch.batch} <span className="text-muted text-xs ml-2">({batch.academicYear})</span>
                                    </td>
                                    <td className="py-4 text-center font-bold text-blue-600">{batch.total}</td>
                                    <td className="py-4 text-center text-green-600">{batch.verified}</td>
                                    <td className="py-4 text-center text-yellow-600">{batch.pending}</td>
                                </tr>
                            ))}
                            {filteredOverview.length === 0 && (
                                <tr><td colSpan="4" className="py-8 text-center text-muted">No participation data available for this selection.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </HodLayout>
    );
};

export default HodAnalytics;
