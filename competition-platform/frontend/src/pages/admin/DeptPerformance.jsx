import React from 'react';
import Sidebar from './Sidebar';

const DeptPerformance = () => {
    const departments = ['CSE', 'AIDS','IT', 'ECE', 'EEE', 'MECH'];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Department Performance</h1>
                    <p className="text-gray-500 mt-1">Cross-department analytics and leaderboard.</p>
                </div>

                {/* Chart Section */}
                <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm mb-8">
                    <h2 className="text-base font-bold text-gray-900 mb-8">Participation vs Qualification Comparison</h2>

                    <div className="space-y-8">
                        {departments.map((dept) => (
                            <div key={dept} className="flex items-center gap-6">
                                {/* Label */}
                                <div className="w-12 font-bold text-gray-800 text-sm">{dept}</div>

                                {/* Bar Container */}
                                <div className="flex-1 h-10 bg-gray-50 rounded-sm relative flex items-center">
                                    {/* Empty Bars (Width 0%) */}
                                    <div
                                        className="h-full bg-blue-500 rounded-l-sm"
                                        style={{ width: '0%' }}
                                    ></div>
                                    <div
                                        className="h-full bg-emerald-500"
                                        style={{ width: '0%' }}
                                    ></div>
                                </div>

                                {/* Values (Zeroed Out) */}
                                <div className="w-24 text-right">
                                    <div className="text-xs font-bold text-gray-800">0 Qlf.</div>
                                    <div className="text-[10px] text-green-600">+0% YoY</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-6 mt-12">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                            <span className="text-sm text-gray-500">Total Registered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                            <span className="text-sm text-gray-500">Qualified (Overlay)</span>
                        </div>
                    </div>
                </div>

                {/* Table Placeholder */}
                <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                    <h2 className="text-base font-bold text-gray-900 mb-6">Department Stats Table</h2>
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead>
                            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <th className="pb-3 pl-4">Rank</th>
                                <th className="pb-3">Department</th>
                                <th className="pb-3">Registered</th>
                                <th className="pb-3">Qualified</th>
                                <th className="pb-3">Conversion Rate</th>
                                <th className="pb-3">Winners</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="6" className="py-6 text-center">No data available</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeptPerformance;
