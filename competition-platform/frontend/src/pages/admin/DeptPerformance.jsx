import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

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
                    <h1 className="text-2xl font-bold text-gray-900">Department Performance</h1>
                    <p className="text-gray-500 mt-1">Cross-department analytics and leaderboard.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <RoleBasedLoader role="ADMIN" />
                    </div>
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
                                    <div className="text-center text-gray-400">No stats available</div>
                                )}
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="text-base font-bold text-gray-900 mb-6">Detailed Drill-down (Click row to view students)</h2>
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead>
                                    <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        <th className="pb-3 pl-4">Department</th>
                                        <th className="pb-3">Section</th>
                                        <th className="pb-3">Count</th>
                                        <th className="pb-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.map(dept => (
                                        dept.sections.map(sec => (
                                            <React.Fragment key={`${dept.department_id}-${sec.name}`}>
                                                <tr
                                                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => setExpandedSection(expandedSection === `${dept.department_id}-${sec.name}` ? null : `${dept.department_id}-${sec.name}`)}
                                                >
                                                    <td className="py-4 pl-4 font-medium text-gray-900">{dept.department_name}</td>
                                                    <td className="py-4">{sec.name}</td>
                                                    <td className="py-4 font-bold text-blue-600">{sec.count}</td>
                                                    <td className="py-4 text-xs text-blue-500 underline">
                                                        {expandedSection === `${dept.department_id}-${sec.name}` ? 'Hide' : 'View Students'}
                                                    </td>
                                                </tr>
                                                {/* Expanded Detail Row */}
                                                {expandedSection === `${dept.department_id}-${sec.name}` && (
                                                    <tr>
                                                        <td colSpan="4" className="bg-gray-50 p-4 rounded-lg">
                                                            <div className="pl-4 border-l-2 border-blue-500">
                                                                <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase">Registered Students in {sec.name}</h4>
                                                                {sec.students && sec.students.length > 0 ? (
                                                                    <ul className="space-y-2">
                                                                        {sec.students.map((stud, idx) => (
                                                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                                                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                                                    {stud.full_name ? stud.full_name.charAt(0) : 'U'}
                                                                                </span>
                                                                                <span className="font-medium">{stud.full_name || 'Unknown Name'}</span>
                                                                                <span className="text-gray-400 text-xs">({stud.email})</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-gray-400 italic font-light">No student details available.</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    ))}
                                    {stats.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-6 text-center">No data available</td>
                                        </tr>
                                    )}
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
