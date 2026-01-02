import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Search, ChevronDown, Filter } from 'lucide-react';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const GlobalRepository = () => {
    const [activeTab, setActiveTab] = useState('All');
    const [deptOpen, setDeptOpen] = useState(false);
    const [platformOpen, setPlatformOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState('All Departments');
    const [selectedPlatform, setSelectedPlatform] = useState('All Platforms');

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

        if (activeTab === 'Active') {
            // Logic: Active means registration is currently open
            if (deadlineDate < now) return false;
        }

        if (activeTab === 'Completed') {
            // Logic: Registration deadline has passed
            if (deadlineDate >= now) return false;
        }

        if (activeTab === 'Upcoming') {
            // Logic: Upcoming treated as Active for now per previous decision
            if (deadlineDate < now) return false;
        }

        // Platform Filter
        if (selectedPlatform !== 'All Platforms') {
            const explicitPlatforms = ['Unstop', 'Devfolio', 'Devpost', 'Hack2skill'];

            if (selectedPlatform === 'Others') {
                // Should match if platform is NOT one of the explicit ones
                if (!comp.platform || explicitPlatforms.includes(comp.platform)) return false;
            } else {
                // Exact match for explicit platforms
                if (!comp.platform || comp.platform !== selectedPlatform) return false;
            }
        }

        // Department Filter
        if (selectedDept !== 'All Departments') {
            // Enhanced Department Filtering Logic
            let deptData = comp.departments;
            if (deptData && deptData !== 'All') {
                let depts = [];

                if (Array.isArray(deptData)) {
                    // Handle array of strings or objects (relations)
                    depts = deptData.map(d => (typeof d === 'object' && d.name) ? d.name : d);
                } else if (typeof deptData === 'string') {
                    // Handle comma-separated or JSON string
                    if (deptData.startsWith('[') && deptData.endsWith(']')) {
                        try {
                            const parsed = JSON.parse(deptData);
                            depts = Array.isArray(parsed) ? parsed : [parsed];
                        } catch (e) {
                            depts = [deptData];
                        }
                    } else {
                        depts = deptData.includes(',') ? deptData.split(',').map(d => d.trim()) : [deptData];
                    }
                } else if (typeof deptData === 'object') {
                    // Single object (relation)
                    if (deptData.name) depts = [deptData.name];
                }

                // Filter check
                // If the competition has departments, check if selectedDept is in them.
                // Also check if 'All' is in them (meaning open to everyone).
                if (depts.length > 0) {
                    if (!depts.includes(selectedDept) && !depts.includes('All') && !depts.includes('All Departments')) {
                        return false;
                    }
                }
            }
        }

        return true;
    }).sort((a, b) => {
        const now = new Date();
        const aDeadline = new Date(a.registration_deadline);
        const bDeadline = new Date(b.registration_deadline);

        const aIsOpen = aDeadline >= now;
        const bIsOpen = bDeadline >= now;

        // Open competitions first
        if (aIsOpen && !bIsOpen) return -1;
        if (!aIsOpen && bIsOpen) return 1;

        // Then sort by deadline (ascending - nearest first)
        return aDeadline - bDeadline;
    });

    const handleViewStats = (competition) => {
        // Navigate to dedicated stats page
        window.location.href = `/admin/repository/${competition.id}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-6 min-w-0">
                <div className="mb-8 text-center">
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
                                        {selectedDept}
                                        <ChevronDown size={16} />
                                    </button>
                                    {deptOpen && (
                                        <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                                            <button
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                                                onClick={() => { setSelectedDept('All Departments'); setDeptOpen(false); }}
                                            >
                                                All Departments
                                            </button>
                                            {['CSE', 'AIDS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(dept => (
                                                <button
                                                    key={dept}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                    onClick={() => { setSelectedDept(dept); setDeptOpen(false); }}
                                                >
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
                                        {selectedPlatform}
                                        <ChevronDown size={16} />
                                    </button>
                                    {platformOpen && (
                                        <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                                            <button
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                                                onClick={() => { setSelectedPlatform('All Platforms'); setPlatformOpen(false); }}
                                            >
                                                All Platforms
                                            </button>
                                            {['Unstop', 'Devfolio', 'Devpost', 'Hack2skill', 'Others'].map(plat => (
                                                <button
                                                    key={plat}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                    onClick={() => { setSelectedPlatform(plat); setPlatformOpen(false); }}
                                                >
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Competition Name</th>
                                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                                    <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Participating Depts</th>
                                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Registrations</th>
                                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualified</th>
                                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-12">
                                            <RoleBasedLoader role="ADMIN" />
                                        </td>
                                    </tr>
                                ) : filteredCompetitions.length > 0 ? (
                                    filteredCompetitions.map((comp) => (
                                        <tr
                                            key={comp.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                            onClick={() => handleViewStats(comp)}
                                        >
                                            <td className="px-4 py-4">
                                                <div className="font-medium text-gray-900 truncate max-w-[200px] group-hover:text-blue-600 transition-colors" title={comp.title}>{comp.title || 'Untitled'}</div>
                                                <div className="text-xs text-gray-500">{comp.organizer}</div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600">{comp.platform}</td>
                                            <td className="px-4 py-4 text-sm text-gray-600">{new Date(comp.registration_deadline).toLocaleDateString()}</td>
                                            <td className="px-4 py-4 text-sm text-gray-600">
                                                {Array.isArray(comp.departments)
                                                    ? comp.departments.join(', ')
                                                    : (comp.departments || 'All')}
                                            </td>
                                            <td className="px-4 py-4 text-center text-sm text-gray-600">-</td>
                                            <td className="px-4 py-4 text-center text-sm text-gray-600">-</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatus(comp.registration_deadline) === 'Open'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {getStatus(comp.registration_deadline)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-12 text-center text-gray-500 text-sm">
                                            No competitions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default GlobalRepository;
