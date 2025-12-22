import React, { useState } from 'react';
import HodSidebar from './Sidebar';
import { Search, ChevronDown, Calendar, Globe, Code } from 'lucide-react';

const HodCompetitions = () => {
    const [filter, setFilter] = useState('All');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Empty competitions list as "fake details" are not allowed
    // The user requested to "add that row of all open" but "without fake details"
    // So we provide the structure (filters/search) but an empty grid.
    const competitions = [];

    const filters = ['All', 'Devfolio', 'CodeForces', 'Google', 'Unstop', 'ICPC', 'CTFTime'];

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <HodSidebar />

            <div className="flex-1 ml-64 p-8">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 space-y-4 md:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Upcoming Competitions</h1>
                        <p className="text-gray-500 mt-1">Discover and register for top programming events</p>
                    </div>

                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search events or tags..."
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
                    {competitions.length > 0 ? (
                        competitions.map(comp => (
                            <div key={comp.id}>
                                {/* Card content would go here */}
                            </div>
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
