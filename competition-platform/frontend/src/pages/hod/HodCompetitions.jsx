import React, { useState } from 'react';
import HodSidebar from './Sidebar';
import { Search, ChevronDown, Calendar, Globe, Code, Menu } from 'lucide-react';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';
import { api } from '../../services/api';
import logo from '../../assets/logo.png';

const HodCompetitions = () => {
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                // api.js handles auth automatically
                const data = await api.get('/api/hod/competitions');
                setCompetitions(data);
            } catch (err) {
                console.error("Failed to fetch competitions", err);
                setError("Network error. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchCompetitions();
    }, []);

    const filteredCompetitions = (Array.isArray(competitions) ? competitions : []).filter(comp => {
        if (!comp) return false;

        // 1. Text Search: Safely handle nulls
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = (comp.title || '').toLowerCase().includes(searchLower);
        const platformMatch = (comp.platform || '').toLowerCase().includes(searchLower);
        const descMatch = (comp.description || '').toLowerCase().includes(searchLower);

        const matchesSearch = titleMatch || platformMatch || descMatch;

        // 2. Dropdown Filter
        const matchesFilter = filter === 'All' || comp.platform === filter;

        return matchesSearch && matchesFilter;
    });

    const filters = ['All', 'Devfolio', 'CodeForces', 'Google', 'Unstop', 'ICPC', 'CTFTime'];

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <HodSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
                {/* Mobile Header with Menu Button */}
                <div className="md:hidden flex items-center justify-between mb-6">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <img src={logo} alt="Logo" className="h-8 object-contain mix-blend-multiply" />
                    <div className="w-10"></div>
                </div>

                {/* Header & Controls */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Upcoming Competitions</h1>
                        <p className="text-gray-500 mt-1">Discover and register for top programming events</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        {/* Search Bar */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search events or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative sm:w-auto">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-between w-full sm:w-32 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <span>{filter}</span>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-full sm:w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                                    {filters.map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => {
                                                setFilter(f);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-12 text-center text-gray-500">Loading competitions...</div>
                    ) : filteredCompetitions.length > 0 ? (
                        filteredCompetitions.map(comp => (
                            <CompetitionCard
                                key={comp.id}
                                competition={comp}
                                showRegister={false} // HODs can't register
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-16 text-center">
                            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 inline-block">
                                <Globe size={48} className="text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No active competitions found</h3>
                                <p className="text-gray-500 mt-2">Try adjusting your filters or check back later.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HodCompetitions;
