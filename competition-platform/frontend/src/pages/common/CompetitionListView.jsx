import React, { useState } from 'react';
import { Search, ChevronDown, Globe } from 'lucide-react';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';

/**
 * CompetitionListView Component
 * 
 * A reusable page layout for displaying a list of competitions with:
 * - Search functionality
 * - Platform filtering
 * - Responsive Grid Layout
 * - Empty state handling
 * 
 * @param {Component} Sidebar - The Sidebar component to render (FacultySidebar, HodSidebar, etc.)
 * @param {Array} competitions - List of competition objects
 * @param {String} title - Page title (default: "Competitions")
 * @param {String} subtitle - Page subtitle
 * @param {Boolean} loading - Loading state
 * @param {Boolean} showRegister - Whether to show register button on cards (default: false)
 * @param {Object} cardActions - Event handlers to pass to CompetitionCard ({ onRegister, onRequestOD, onVerifyGmail })
 */
const CompetitionListView = ({
    Sidebar,
    competitions = [],
    title = "Competitions",
    subtitle = "View all ongoing and upcoming competitions.",
    loading = false,
    showRegister = false,
    cardActions = {}
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('All');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const filters = ['All', 'Devfolio', 'CodeForces', 'Google', 'Unstop', 'ICPC', 'CTFTime'];

    const filteredCompetitions = (Array.isArray(competitions) ? competitions : []).filter(comp => {
        if (!comp) return false;

        // 1. Text Search
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = (comp.title || '').toLowerCase().includes(searchLower);
        const platformMatch = (comp.platform || '').toLowerCase().includes(searchLower);
        const descMatch = (comp.description || '').toLowerCase().includes(searchLower);

        const matchesSearch = titleMatch || platformMatch || descMatch;

        // 2. Dropdown Filter
        const matchesFilter = filter === 'All' || comp.platform === filter;

        return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        // Sort by Priority: Active > Expired > No Deadline

        // Helper to get deadline from correct property (DB uses registration_deadline)
        const getDeadline = (obj) => obj.registration_deadline || obj.deadline;

        // Helper to parse 'DD/MM/YYYY' or ISO string
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            if (dateStr.includes('/')) {
                const [day, month, year] = dateStr.split('/');
                const paddedMonth = month.padStart(2, '0');
                const paddedDay = day.padStart(2, '0');
                return new Date(`${year}-${paddedMonth}-${paddedDay}`);
            }
            return new Date(dateStr);
        };

        const deadlineA = getDeadline(a);
        const deadlineB = getDeadline(b);

        const dateA = parseDate(deadlineA);
        const dateB = parseDate(deadlineB);

        // No deadline -> Push to end
        if (!dateA || isNaN(dateA.getTime())) return 1;
        if (!dateB || isNaN(dateB.getTime())) return -1;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const isExpiredA = dateA < now;
        const isExpiredB = dateB < now;

        // 1. Separation: Active first, Expired last
        if (isExpiredA !== isExpiredB) {
            return isExpiredA ? 1 : -1;
        }

        // 2. Sorting by Sub-group
        if (isExpiredA) {
            // Both Expired: Descending (Most recently closed first, i.e., closer to Today)
            // dateB is "larger" (more recent) -> comes first
            return dateB - dateA;
        }

        // Both Active: Ascending (Approaching deadline first)
        return dateA - dateB;
    });

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
            {/* Render the passed Sidebar component */}
            <Sidebar />

            <div className="flex-1 ml-64 p-8">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 space-y-4 md:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        <p className="text-gray-500 mt-1">{subtitle}</p>
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-between w-32 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <span>{filter}</span>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
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
                        <div className="col-span-full py-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredCompetitions.length > 0 ? (
                        filteredCompetitions.map(comp => (
                            <CompetitionCard
                                key={comp.id}
                                competition={comp}
                                showRegister={showRegister}
                                {...cardActions}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-16 text-center">
                            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 inline-block">
                                <Globe size={48} className="text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No competitions found</h3>
                                <p className="text-gray-500 mt-2">Try adjusting your filters.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompetitionListView;
