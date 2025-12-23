import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Search, ChevronDown, Filter } from 'lucide-react';

const GlobalRepository = () => {
    const [activeTab, setActiveTab] = useState('All');
    const [deptOpen, setDeptOpen] = useState(false);
    const [platformOpen, setPlatformOpen] = useState(false);

    const tabs = ['All', 'Active', 'Upcoming', 'Completed'];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Global Repository</h1>
                    <p className="text-gray-500 mt-1">Master list of all competitions managed by CIT.</p>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    {/* Tabs */}
                    <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Dropdowns */}
                    <div className="flex gap-4">
                        <div className="relative">
                            <button
                                onClick={() => { setDeptOpen(!deptOpen); setPlatformOpen(false); }}
                                className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 w-44 justify-between"
                            >
                                All Departments
                                <ChevronDown size={16} />
                            </button>
                            {deptOpen && (
                                <div className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-10">
                                    {['CSE', 'AIDS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(dept => (
                                        <button key={dept} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            {dept}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => { setPlatformOpen(!platformOpen); setDeptOpen(false); }}
                                className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 w-40 justify-between"
                            >
                                All Platforms
                                <ChevronDown size={16} />
                            </button>
                            {platformOpen && (
                                <div className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-10">
                                    {['Devfolio', 'Unstop', 'HackerRank', 'Kaggle'].map(plat => (
                                        <button key={plat} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            {plat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Competition Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Participating Depts</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Registrations</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualified</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Empty Body as requested */}
                            <tr>
                                <td colSpan="8" className="px-6 py-12 text-center text-gray-500 text-sm">
                                    No competitions found.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GlobalRepository;
