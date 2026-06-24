import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Users, Award, Star, TrendingUp, Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-lg border border-gray-100 dark:border-zinc-700">
                <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-600 dark:text-gray-300 capitalize">{entry.name}:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const DeptPerformance = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // api.js handles auth headers automatically
                const result = await api.get('/api/admin/stats');

                // Backend returns { success: true, data: [...] } based on stats.controller
                if (result.success && Array.isArray(result.data)) {
                    setStats(result.data);
                } else if (Array.isArray(result)) {
                    setStats(result);
                } else if (result.data) {
                    setStats(result.data); // Generic wrapper check
                }
            } catch (err) {
                console.error("Error loading department performance:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Summary calculations
    const totalDepartments = stats.length;
    const totalRegistrations = stats.reduce((acc, curr) => acc + curr.total_registrations, 0);
    const topDept = [...stats].sort((a, b) => b.total_registrations - a.total_registrations)[0] || null;

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex transition-colors duration-200">
            <Sidebar />
            <div className="flex-1 md:ml-sidebar p-4 md:p-8 pt-16 md:pt-8 w-full max-w-7xl mx-auto">
                <motion.div 
                    initial="hidden" 
                    animate="visible" 
                    variants={containerVariants}
                    className="w-full"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <Activity size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Department Analytics</h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">Comprehensive overview of active department registrations and performance.</p>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center p-20">
                            <RoleBasedLoader role="ADMIN" />
                        </div>
                    ) : stats.length === 0 ? (
                        <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Data Available</h3>
                            <p className="text-gray-500 dark:text-gray-400">There are currently no active registrations to display.</p>
                        </motion.div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-300">
                                        <Users size={80} className="text-blue-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 relative z-10">Total Active Departments</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white relative z-10">{totalDepartments}</h3>
                                </motion.div>

                                <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-md relative overflow-hidden text-white group hover:shadow-lg transition-all">
                                    <div className="absolute -top-4 -right-4 p-4 opacity-20 group-hover:scale-110 transition-transform duration-300">
                                        <TrendingUp size={80} />
                                    </div>
                                    <p className="text-sm font-medium text-blue-100 mb-1 relative z-10">Total Registrations</p>
                                    <h3 className="text-3xl font-bold relative z-10">{totalRegistrations}</h3>
                                    <p className="text-xs text-blue-200 mt-2 relative z-10 opacity-80">Across all active events</p>
                                </motion.div>

                                <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-300">
                                        <Award size={80} className="text-amber-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 relative z-10">Top Performing Dept</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white truncate relative z-10">{topDept?.department_name || 'N/A'}</h3>
                                    {topDept && (
                                        <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-2 relative z-10 flex items-center gap-1">
                                            <Star size={12} fill="currentColor" /> {topDept.total_registrations} Registrations
                                        </p>
                                    )}
                                </motion.div>
                            </div>

                            {/* Chart Section */}
                            <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm mb-8">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Registration Distribution</h2>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={stats}
                                            margin={{ top: 20, right: 30, left: -20, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
                                            <XAxis 
                                                dataKey="department_name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                                                dy={10}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                                                dx={-10}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.05)' }} />
                                            <Bar 
                                                dataKey="total_registrations" 
                                                name="Registrations" 
                                                radius={[6, 6, 0, 0]}
                                                maxBarSize={60}
                                                animationDuration={1500}
                                            >
                                                {stats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* Data Table */}
                            <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detailed Statistics</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                                        <thead className="bg-gray-50 dark:bg-zinc-900/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                                            <tr>
                                                <th className="px-6 py-4">Department</th>
                                                <th className="px-6 py-4">Active Sections</th>
                                                <th className="px-6 py-4 text-center">Shortlisted</th>
                                                <th className="px-6 py-4 text-center">Winners</th>
                                                <th className="px-6 py-4 text-right">Total Reg.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                            {stats.map((dept, idx) => (
                                                <motion.tr 
                                                    key={dept.department_id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 * idx }}
                                                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div 
                                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm"
                                                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                            >
                                                                {dept.department_name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className="font-bold text-gray-900 dark:text-white">{dept.department_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {dept.sections && dept.sections.length > 0
                                                                ? dept.sections.map((s, i) => (
                                                                    <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-md text-xs font-medium border border-gray-200 dark:border-zinc-700">
                                                                        {s.name} ({s.count})
                                                                    </span>
                                                                ))
                                                                : <span className="text-gray-400 italic">None</span>
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {dept.shortlisted > 0 ? (
                                                            <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold rounded-full border border-amber-200 dark:border-amber-800/50">
                                                                {dept.shortlisted}
                                                            </span>
                                                        ) : <span className="text-gray-400">-</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {dept.winners > 0 ? (
                                                            <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-bold rounded-full border border-green-200 dark:border-green-800/50">
                                                                {dept.winners}
                                                            </span>
                                                        ) : <span className="text-gray-400">-</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                            {dept.total_registrations}
                                                        </span>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default DeptPerformance;
