import React from 'react';
import HodSidebar from './Sidebar';
import { TrendingUp, Users, Award, BarChart2 } from 'lucide-react';

const HodAnalytics = () => {
    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <HodSidebar />

            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Department Analytics</h1>
                    <p className="text-gray-500 mt-1">Performance insights and participation trends for CSE Department.</p>
                </div>

                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AVG. QUALIFICATION RATE</h3>
                        <div className="text-3xl font-bold text-gray-900 mb-2">0%</div>
                        <div className="flex items-center text-xs text-green-600 font-medium">
                            <TrendingUp size={14} className="mr-1" />
                            <span>+0% vs last semester</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">TOTAL WINS (GOLD/SILVER)</h3>
                        <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
                        <p className="text-xs text-gray-400">Target: 0 by year end</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ACTIVE PARTICIPANTS</h3>
                        <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
                        <div className="flex items-center text-xs text-green-600 font-medium">
                            <TrendingUp size={14} className="mr-1" />
                            <span>+0% growth rate</span>
                        </div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Growth Trend Placeholder */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80">
                        <h3 className="text-base font-bold text-gray-900 mb-6">Participation Growth Trend</h3>
                        <div className="h-full flex items-end justify-between px-4 pb-8 space-x-2">
                            {['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'].map(month => (
                                <div key={month} className="flex flex-col items-center w-full">
                                    <div className="w-full h-48 flex items-end justify-center">
                                        {/* Plain empty graph */}
                                    </div>
                                    <span className="text-xs text-gray-400 mt-4">{month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section Qualification */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
                        <h3 className="text-base font-bold text-gray-900 mb-6">Qualification Rate by Section</h3>
                        <div className="space-y-6">
                            {['CSE A', 'CSE B', 'CSE C', 'CSE D'].map(section => (
                                <div key={section}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-gray-700">{section}</span>
                                        <span className="text-sm font-bold text-gray-900">0%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
                            <p className="text-xs text-purple-800 leading-relaxed">
                                <span className="font-bold">Insight:</span> NOT ENOUGH DATA. No significant deviations in qualification rates observed across sections yet.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ROI Analysis Table */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Competition ROI Analysis</h3>
                    <p className="text-sm text-gray-500 mb-6">Events yielding highest qualification counts</p>

                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/3">Competition Name</th>
                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/4">Total Participants</th>
                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/4">Qualification/Win Rate</th>
                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/6">Impact Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="4" className="py-8 text-center text-sm text-gray-500">
                                    No competition data available for analysis.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default HodAnalytics;
