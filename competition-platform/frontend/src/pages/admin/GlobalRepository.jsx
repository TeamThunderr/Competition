import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Search, ChevronDown, Filter } from 'lucide-react';
import { api } from '../../services/api';

const GlobalRepository = () => {
    const [activeTab, setActiveTab] = useState('All');
    const [deptOpen, setDeptOpen] = useState(false);
    const [platformOpen, setPlatformOpen] = useState(false);

    const tabs = ['All', 'Active', 'Upcoming', 'Completed'];

    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const data = await api.get('/api/competitions');
                setCompetitions(data);
            } catch (err) {
                console.error("Failed to fetch competitions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompetitions();
    }, []);

    const getStatus = (deadline) => {
        return new Date(deadline) > new Date() ? 'Open' : 'Closed';
    };

    const filteredCompetitions = competitions.filter(comp => {
        const deadlineDate = new Date(comp.registration_deadline);
        const now = new Date();
        // Reset time for date-only comparison if desired, but precise is safer

        if (activeTab === 'All') return true;

        if (activeTab === 'Active') {
            // Logic: Active means registration is currently open
            return deadlineDate >= now;
        }

        if (activeTab === 'Completed') {
            // Logic: Registration deadline has passed
            return deadlineDate < now;
        }

        if (activeTab === 'Upcoming') {
            // Logic: Usually for "Registration starts in future", but for now, 
            // user requested tabs to work. If data lacks start_date, merge with Active or omit.
            // Let's assume Upcoming means "Active" but maybe far out? 
            // Or if user intends "Events happening in future but reg closed?"
            // Standard interpretation: 
            // Active = Reg Open. 
            // Upcoming = Reg hasn't started yet. (Need reg_start_date)
            // Since we only have deadline, I will handle 'Upcoming' as 'Active' for now OR 'Open > 7 days'?
            // Let's stick to: Upcoming = Same as Active (Reg Open) to avoid empty list, 
            // or check if 'event_date' is far future?
            // User said: "according to database".
            // If DB has no start_date, I will just treat 'Active' as Open.
            // I will make 'Upcoming' show competitions where deadline is > 30 days from now? 
            // Or better: Active = open, Upcoming = open.
            return deadlineDate >= now;
        }

        return true;
    });

    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [selectedCompetitionStats, setSelectedCompetitionStats] = useState(null);
    const [selectedCompTitle, setSelectedCompTitle] = useState('');
    const [statsError, setStatsError] = useState(null);

    const handleViewStats = async (competition) => {
        setSelectedCompTitle(competition.title);
        setSelectedCompetitionStats(null); // Reset
        setStatsError(null); // Reset error
        setStatsModalOpen(true);

        console.log("Fetching stats for:", competition.id);

        try {
            const data = await api.get(`/api/admin/competition/${competition.id}/stats`);
            console.log("Stats received:", data);
            setSelectedCompetitionStats(data);
        } catch (error) {
            console.error("Failed to fetch stats", error);
            setStatsError("Network error or server unreachable.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-6 min-w-0">
                <div className="mb-8 text-left">
                    <h1 className="text-2xl font-bold text-gray-900">Global Repository</h1>
                    <p className="text-gray-500 mt-1">Master list of all competitions managed by CIT.</p>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                    {/* Filter Bar */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-wrap">
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
                            <div className="flex gap-3 flex-wrap">
                                <div className="relative">
                                    <button
                                        onClick={() => { setDeptOpen(!deptOpen); setPlatformOpen(false); }}
                                        className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 w-44 justify-between transition-colors"
                                    >
                                        All Departments
                                        <ChevronDown size={16} />
                                    </button>
                                    {deptOpen && (
                                        <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
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
                                        className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 w-40 justify-between transition-colors"
                                    >
                                        All Platforms
                                        <ChevronDown size={16} />
                                    </button>
                                    {platformOpen && (
                                        <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
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
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">Loading...</td>
                                    </tr>
                                ) : competitions.length > 0 ? (
                                    competitions.map((comp) => (
                                        <tr key={comp.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{comp.title || 'Untitled'}</div>
                                                <div className="text-xs text-gray-500">{comp.organizer}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{comp.platform}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(comp.registration_deadline).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">All</td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-600">-</td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-600">-</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatus(comp.registration_deadline) === 'Open'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {getStatus(comp.registration_deadline)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleViewStats(comp)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500 text-sm">
                                            No competitions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>




                {/* Stats Modal */}
                {
                    statsModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-900">{selectedCompTitle} - Statistics</h2>
                                    <button onClick={() => setStatsModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                                </div>

                                <div className="p-6 overflow-y-auto">
                                    {statsError ? (
                                        <div className="text-center text-red-600 py-8">
                                            <p className="font-bold">Error</p>
                                            <p>{statsError}</p>
                                        </div>
                                    ) : !selectedCompetitionStats ? (
                                        <div className="text-center py-8">Loading stats...</div>
                                    ) : (
                                        <div>
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-3 gap-4 mb-6">
                                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-blue-700">{selectedCompetitionStats.overall.total}</div>
                                                    <div className="text-xs text-blue-600 uppercase font-bold">Total Registrations</div>
                                                </div>
                                                <div className="bg-purple-50 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-purple-700">{selectedCompetitionStats.overall.shortlisted}</div>
                                                    <div className="text-xs text-purple-600 uppercase font-bold">Shortlisted</div>
                                                </div>
                                                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-yellow-700">{selectedCompetitionStats.overall.winners}</div>
                                                    <div className="text-xs text-yellow-600 uppercase font-bold">Winners</div>
                                                </div>
                                            </div>

                                            {/* Department Breakdown Table */}
                                            <h3 className="font-bold text-gray-900 mb-3">Department Breakdown</h3>
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 font-medium text-gray-500">Department</th>
                                                        <th className="px-4 py-2 font-medium text-gray-500 text-center">Registered</th>
                                                        <th className="px-4 py-2 font-medium text-gray-500 text-center">Shortlisted</th>
                                                        <th className="px-4 py-2 font-medium text-gray-500 text-center">Winners</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {selectedCompetitionStats.departments.map((dept, index) => (
                                                        <tr key={index}>
                                                            <td className="px-4 py-3 text-gray-900">{dept.name}</td>
                                                            <td className="px-4 py-3 text-center text-gray-600">{dept.registrations}</td>
                                                            <td className="px-4 py-3 text-center text-gray-600">{dept.shortlisted}</td>
                                                            <td className="px-4 py-3 text-center text-gray-600">{dept.winners}</td>
                                                        </tr>
                                                    ))}
                                                    {selectedCompetitionStats.departments.length === 0 && (
                                                        <tr>
                                                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No data available.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                                    <button
                                        onClick={() => setStatsModalOpen(false)}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div >
    );
};

export default GlobalRepository;
