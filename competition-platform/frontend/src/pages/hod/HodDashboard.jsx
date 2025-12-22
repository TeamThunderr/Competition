import React, { useEffect, useState } from 'react';
import CompetitionCard from "../../components/features/competitions/CompetitionCard";
import supabase from '../../services/supabaseClient';

const HodDashboard = () => {
    const [competitions, setCompetitions] = useState([]);
    const [stats, setStats] = useState({ total_registrations: 0, verified_registrations: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const headers = { 'x-user-id': session?.user?.id };

                // 1. Fetch Competitions
                const compRes = await fetch('http://localhost:5000/api/competitions');
                if (compRes.ok) setCompetitions(await compRes.json());

                // 2. Fetch Stats
                if (session?.user?.id) {
                    const statsRes = await fetch('http://localhost:5000/api/hod/stats', { headers });
                    if (statsRes.ok) {
                        const json = await statsRes.json();
                        if (json.success) setStats(json.data); // data is wrapped in responseHelper
                    }
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">HOD Dashboard</h1>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Registrations</h3>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total_registrations}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
                    <h3 className="text-xs font-semibold text-green-600 uppercase">Verified / Qualified</h3>
                    <div className="text-3xl font-bold text-green-700 mt-2">{stats.verified_registrations}</div>
                </div>
            </div>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Department Competition Status</h2>

                {loading ? (
                    <div className="text-gray-500">Loading events...</div>
                ) : competitions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {competitions.map(comp => (
                            <CompetitionCard
                                key={comp.id}
                                competition={comp}
                                showRegister={false}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500">No active competitions.</div>
                )}
            </section>
        </div>
    );
};

export default HodDashboard;
