import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ArrowLeft, Trophy, Users, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const CompetitionStats = () => {
    const { id } = useParams();
    const [stats, setStats] = useState(null);
    const [competition, setCompetition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch basic competition details for the title
                const compData = await api.get(`/api/competitions/${id}`);
                setCompetition(compData);

                // Fetch stats
                const statsData = await api.get(`/api/admin/competition/${id}/stats`);
                setStats(statsData);
            } catch (err) {
                console.error("Failed to fetch data", err);
                setError("Failed to load competition statistics.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <RoleBasedLoader role="ADMIN" />
            </div>
        );
    }

    if (error || !stats || !competition) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <div className="flex-1 ml-64 p-8 flex flex-col items-center justify-center">
                    <div className="text-red-500 mb-4">{error || "Data not found"}</div>
                    <Link to="/admin/repository" className="text-blue-600 hover:underline">Return to Repository</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8 font-sans">
                {/* Header */}
                <div className="mb-8 relative">
                    <Link to="/admin/repository" className="absolute left-0 top-0 inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Repository
                    </Link>
                    <div className="text-center pt-8">
                        <h1 className="text-2xl font-bold text-gray-900">{competition.title}</h1>
                        <p className="text-gray-500 mt-1">Real-time participation and performance statistics.</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-900">{stats.overall.total}</div>
                            <div className="text-sm text-gray-500 font-medium uppercase">Total Registrations</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-full">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-900">{stats.overall.shortlisted}</div>
                            <div className="text-sm text-gray-500 font-medium uppercase">Shortlisted</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-yellow-50 text-yellow-600 rounded-full">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-900">{stats.overall.winners}</div>
                            <div className="text-sm text-gray-500 font-medium uppercase">Winners</div>
                        </div>
                    </div>
                </div>

                {/* Department Breakdown */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Department Breakdown</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Shortlisted</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Winners</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.departments.map((dept, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{dept.name}</td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-600">{dept.registrations}</td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-600">{dept.shortlisted}</td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-600">{dept.winners}</td>
                                    </tr>
                                ))}
                                {stats.departments.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">No department data available.</td>
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

export default CompetitionStats;
