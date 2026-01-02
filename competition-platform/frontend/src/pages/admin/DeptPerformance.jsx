import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { api } from '../../services/api';

const DeptPerformance = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSection, setExpandedSection] = useState(null);

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

    const maxCount = Math.max(...stats.map(s => s.total_registrations), 1);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Active Department Performance</h1>
                    <p className="text-gray-500 mt-1">Analytics for departments with active registrations.</p>
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <>
                        {/* Chart Section */}
                        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm mb-8">
                            <h2 className="text-base font-bold text-gray-900 mb-8">Department Registrations</h2>

                            <div className="space-y-8">
                                {stats.length > 0 ? stats.map((dept) => (
                                    <div key={dept.department_id} className="flex items-center gap-6">
                                        {/* Label */}
                                        <div className="w-24 font-bold text-gray-800 text-sm truncate" title={dept.department_name}>
                                            {dept.department_name}
                                        </div>

                                        {/* Bar Container */}
                                        <div className="flex-1 h-10 bg-gray-50 rounded-sm relative flex items-center">
                                            <div
                                                className="h-full bg-blue-500 rounded-l-sm transition-all duration-500"
                                                style={{ width: `${(dept.total_registrations / maxCount) * 100}%` }}
                                            ></div>
                                        </div>

                                        {/* Values */}
                                        <div className="w-24 text-right">
                                            <div className="text-xs font-bold text-gray-800">{dept.total_registrations} Reg.</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-gray-400 py-8">No active departments found (0 registrations)</div>
                                )}
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="text-base font-bold text-gray-900 mb-6">Detailed Department Stats</h2>
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead>
                                    <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        <th className="pb-3 pl-4">Department</th>
                                        <th className="pb-3">Sections Active</th>
                                        <th className="pb-3">Total Participating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.map(dept => (
                                        <React.Fragment key={dept.department_id}>
                                            <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 pl-4 font-medium text-gray-900">{dept.department_name}</td>
                                                <td className="py-4">
                                                    {dept.sections && dept.sections.length > 0
                                                        ? dept.sections.map(s => `${s.name} (${s.count})`).join(', ')
                                                        : <span className="text-gray-400">None</span>
                                                    }
                                                </td>
                                                <td className="py-4 font-bold text-blue-600">{dept.total_registrations}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DeptPerformance;
