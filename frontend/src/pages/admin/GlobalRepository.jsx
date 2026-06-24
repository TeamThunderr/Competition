import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const GlobalRepository = () => {
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('globalRepoTab') || 'Active';
    });

    // Update localStorage when tab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        localStorage.setItem('globalRepoTab', tab);
    };
    const [deptOpen, setDeptOpen] = useState(false);
    const [platformOpen, setPlatformOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState('All Departments');
    const [selectedPlatform, setSelectedPlatform] = useState('All Platforms');
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = ['Active', 'Completed', 'All'];

    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const response = await api.get('/api/competitions');
                // Handle standardized response wrapper if present
                const comps = Array.isArray(response) ? response : (response.data || []);

                if (Array.isArray(comps)) {
                    setCompetitions(comps);
                } else {
                    console.error("API returned non-array:", response);
                    setCompetitions([]);
                }
            } catch (err) {
                console.error("Failed to fetch competitions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompetitions();
    }, []);



    const filteredCompetitions = competitions.filter(comp => {
        const deadlineDate = new Date(comp.registration_deadline);
        deadlineDate.setHours(23, 59, 59, 999); // Include entire deadline day
        const now = new Date();

        if (activeTab === 'Active') {
            // Logic: Active means registration is currently open (deadline is future or today)
            if (deadlineDate < now) return false;
        }

        if (activeTab === 'Completed') {
            // Logic: Registration deadline has passed
            if (deadlineDate >= now) return false;
        }

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const title = (comp.title || '').toLowerCase();
            const platform = (comp.platform || '').toLowerCase();
            const organizer = (comp.organizer || '').toLowerCase();

            if (!title.includes(query) && !platform.includes(query) && !organizer.includes(query)) {
                return false;
            }
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
            let deptData = comp.departments;
            const normalizeDepts = (data) => {
                if (!data) return [];
                if (data === 'All') return ['ALL'];
                if (Array.isArray(data)) {
                    return data.map(d => {
                        const val = (typeof d === 'object' && d?.name) ? d.name : d;
                        return String(val).toUpperCase().trim();
                    });
                }
                if (typeof data === 'string') {
                    // Try parsing JSON array string
                    if (data.trim().startsWith('[') && data.trim().endsWith(']')) {
                        try {
                            const parsed = JSON.parse(data);
                            return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
                        } catch (e) {
                            return [data.toUpperCase().trim()];
                        }
                    }
                    return data.split(',').map(d => d.trim().toUpperCase());
                }
                if (typeof data === 'object' && data.name) {
                    return [String(data.name).toUpperCase().trim()];
                }
                return [String(data).toUpperCase().trim()];
            };

            const normalized = normalizeDepts(deptData);

            // Check if selected department is in the list
            const target = selectedDept.toUpperCase().trim();
            // Strict match: Only show if the target department is explicitly in the list
            const hasMatch = normalized.some(d => d === target);

            if (!hasMatch) return false;
        }

        return true;
    }).sort((a, b) => {
        const now = new Date();

        // Helper to get end of day for accurate comparison
        const getEndOfDay = (d) => {
            const date = new Date(d);
            date.setHours(23, 59, 59, 999);
            return date;
        };

        const aDeadline = getEndOfDay(a.registration_deadline);
        const bDeadline = getEndOfDay(b.registration_deadline);

        const aIsOpen = aDeadline >= now;
        const bIsOpen = bDeadline >= now;

        // 1. Open competitions always first
        if (aIsOpen && !bIsOpen) return -1;
        if (!aIsOpen && bIsOpen) return 1;

        // 2. If both are Open, sort by deadline (Ascending - Nearest first)
        if (aIsOpen && bIsOpen) {
            return aDeadline - bDeadline;
        }

        // 3. If both are Closed, sort by deadline (Descending - Most recently closed first)
        return bDeadline - aDeadline;
    });

    const navigate = useNavigate(); // Add hook usage

    const handleViewStats = (competition) => {
        // Navigate to dedicated stats page
        navigate(`/admin/repository/${competition.id}`);
    };

    return (
        <>
                <div className="w-[95%] mx-auto">
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-foreground">Global Repository</h1>
                        <p className="text-muted mt-1">Master list of all competitions managed by CIT.</p>
                    </div>

                    {/* Content Card */}
                    <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col transition-colors duration-200">
                        {/* Filter Bar */}
                        <div className="p-6 border-b border-border">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-wrap">

                                {/* Left Side: Search + Filters */}
                                <div className="flex flex-col gap-4 w-full md:w-auto flex-1">
                                    {/* Search Bar - Line 1 */}
                                    <div className="relative w-full md:w-96">
                                        <input
                                            type="text"
                                            placeholder="Search competitions..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground placeholder-muted"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-muted" size={16} />
                                    </div>

                                    {/* Dropdowns - Line 2 */}
                                    <div className="flex gap-3 flex-wrap">
                                        <div className="relative">
                                            <button
                                                onClick={() => { setDeptOpen(!deptOpen); setPlatformOpen(false); }}
                                                className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-lg text-sm text-foreground hover:bg-muted/10 w-44 justify-between transition-colors"
                                            >
                                                {selectedDept}
                                                <ChevronDown size={16} />
                                            </button>
                                            {deptOpen && (
                                                <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                                                    <button
                                                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/10 font-medium"
                                                        onClick={() => { setSelectedDept('All Departments'); setDeptOpen(false); }}
                                                    >
                                                        All Departments
                                                    </button>
                                                    {['CSE', 'AIDS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(dept => (
                                                        <button
                                                            key={dept}
                                                            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/10"
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
                                                className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-lg text-sm text-foreground hover:bg-muted/10 w-40 justify-between transition-colors"
                                            >
                                                {selectedPlatform}
                                                <ChevronDown size={16} />
                                            </button>
                                            {platformOpen && (
                                                <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                                                    <button
                                                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/10 font-medium"
                                                        onClick={() => { setSelectedPlatform('All Platforms'); setPlatformOpen(false); }}
                                                    >
                                                        All Platforms
                                                    </button>
                                                    {['Unstop', 'Devfolio', 'Devpost', 'Hack2skill', 'Others'].map(plat => (
                                                        <button
                                                            key={plat}
                                                            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/10"
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

                                {/* Tabs */}
                                <div className="flex bg-muted/10 rounded-lg p-1 border border-border shadow-sm ml-auto self-start">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => handleTabChange(tab)}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab
                                                ? 'bg-background text-blue-600 shadow-sm border border-border dark:text-blue-400'
                                                : 'text-muted hover:text-foreground hover:bg-background/50'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[900px]">
                                <thead>
                                    <tr className="bg-muted/10 border-b border-border">
                                        <th className="px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-[280px]">Competition Name</th>
                                        <th className="px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-[130px]">Platform</th>
                                        <th className="px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-[120px]">Deadline</th>
                                        <th className="px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-[150px]">Event Date</th>
                                        <th className="px-4 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-[150px]">Participating Depts</th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-muted uppercase tracking-wider w-[50px]">Reg</th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-muted uppercase tracking-wider w-[70px]">Qualified</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-12">
                                                <RoleBasedLoader role="ADMIN" />
                                            </td>
                                        </tr>
                                    ) : filteredCompetitions.length > 0 ? (
                                        filteredCompetitions.map((comp) => (
                                            <tr
                                                key={comp.id}
                                                className="hover:bg-muted/5 transition-colors cursor-pointer group"
                                                onClick={() => handleViewStats(comp)}
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="font-medium text-foreground truncate max-w-[200px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={comp.title}>{comp.title || 'Untitled'}</div>
                                                    <div className="text-xs text-muted">{comp.organizer}</div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-foreground truncate">{comp.platform}</td>
                                                <td className="px-4 py-4 text-sm text-foreground">{new Date(comp.registration_deadline).toLocaleDateString()}</td>
                                                <td className="px-4 py-4 text-sm text-foreground">
                                                    {comp.event_date ? new Date(comp.event_date).toLocaleDateString() : 'TBA'}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-foreground truncate" title={Array.isArray(comp.departments) ? comp.departments.join(', ') : (comp.departments || 'All')}>
                                                    {Array.isArray(comp.departments)
                                                        ? comp.departments.join(', ')
                                                        : (comp.departments || 'All')}
                                                </td>
                                                <td className="px-4 py-4 text-center text-sm text-muted">-</td>
                                                <td className="px-4 py-4 text-center text-sm text-muted">-</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-12 text-center text-muted text-sm">
                                                No competitions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
        </>
    );
};

export default GlobalRepository;
