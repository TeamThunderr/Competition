import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Search, Globe } from 'lucide-react';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';
import { api } from '../../services/api';

const ActiveCompetitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                // Using HOD endpoint as it likely returns all competitions appropriate for staff view
                // Or fallback to student endpoint if needed. Let's try HOD one first or a generic one.
                const response = await api.get('/api/faculty/competitions');
                setCompetitions(response.data || response);
            } catch (err) {
                console.error("Failed to fetch competitions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompetitions();
    }, []);

    const filteredCompetitions = competitions.filter(comp => {
        if (!comp) return false;
        const searchLower = searchQuery.toLowerCase();
        return (comp.title || '').toLowerCase().includes(searchLower) ||
            (comp.platform || '').toLowerCase().includes(searchLower);
    });

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
            <Sidebar />

            <div className="flex-1 ml-64 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Active Competitions</h1>
                        <p className="text-gray-500 mt-1">View all ongoing and upcoming competitions.</p>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search competitions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredCompetitions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCompetitions.map(comp => (
                            <CompetitionCard
                                key={comp.id}
                                competition={comp}
                                showRegister={false}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Globe size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No competitions found</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActiveCompetitions;
