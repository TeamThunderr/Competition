
import React, { useEffect, useState } from 'react';
import { Bell, Clock, Activity, Download, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import CompetitionCard from "../../components/features/competitions/CompetitionCard";
import supabase from '../../services/supabaseClient';

const FacultyDashboard = () => {
    // Top Stats Cards Data
    const [stats, setStats] = useState([
        { label: 'TOTAL STUDENTS', value: '0', subtext: 'CSE-A' },
        { label: 'COMP. REGISTERED', value: '0', subtext: 'Active Participations' },
        { label: 'COMP. QUALIFIED', value: '0', subtext: 'Round 1 Cleared' },
        { label: 'OD REQUESTS', value: '0', subtext: 'Pending Coordinator' },
    ]);

    const [competitions, setCompetitions] = useState([]);
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Get Session for Headers
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            const headers = { 'Content-Type': 'application/json', 'x-user-id': userId };

            // 2. Fetch Competitions
            const compRes = await fetch('http://localhost:5000/api/competitions');
            if (compRes.ok) {
                setCompetitions(await compRes.json());
            }

            // 3. Fetch Pending Verifications
            if (userId) {
                const verifyRes = await fetch('http://localhost:5000/api/faculty/pending-verifications', { headers });
                if (verifyRes.ok) {
                    const verifyData = await verifyRes.json();
                    setVerifications(verifyData);

                    // Update stats with Pending Cnt
                    setStats(prev => {
                        const newStats = [...prev];
                        newStats[3].value = verifyData.length.toString();
                        return newStats;
                    });
                }

                // 4. Fetch Faculty Stats
                const statsRes = await fetch('http://localhost:5000/api/faculty/stats', { headers });
                if (statsRes.ok) {
                    const getRes = await statsRes.json();
                    if (getRes.success) {
                        const statData = getRes.data;
                        setStats(prev => {
                            const newStats = [...prev];
                            newStats[1].value = statData.total_registrations.toString();
                            newStats[2].value = (statData.verified_registrations || 0).toString();
                            return newStats;
                        });
                    }
                }
            }

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleVerify = async (regId, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this registration?`)) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('http://localhost:5000/api/faculty/verify-registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': session?.user?.id
                },
                body: JSON.stringify({ registration_id: regId, status })
            });

            if (response.ok) {
                alert(`Registration ${status} successfully!`);
                fetchData(); // Refresh list
            } else {
                alert("Action failed. Please try again.");
            }
        } catch (err) {
            console.error("Verification Error:", err);
            alert("Error processing request.");
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
            <Sidebar />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Section Mentor Dashboard</h1>
                    <div className="flex items-center gap-2 text-gray-600 mt-2 text-sm">
                        <span>Class CSE-A</span>
                        <span>|</span>
                        <span>Batch 2023-2027</span>
                        <span>|</span>
                        <span className="text-blue-600 font-medium">Read-Only Mode</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{stat.label}</h3>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                            <div className="text-xs text-gray-400">{stat.subtext}</div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Student Registrations (Span 2) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Registrations Table */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Pending Verifications</h2>
                                    <p className="text-sm text-gray-500 mt-1">Students requiring proof approval</p>
                                </div>
                                <button onClick={fetchData} className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
                                    Refresh List
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                {verifications.length > 0 ? (
                                    <table className="w-full">
                                        <thead className="bg-gray-50/50">
                                            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <th className="px-6 py-4">Student</th>
                                                <th className="px-6 py-4">Competition</th>
                                                <th className="px-6 py-4">Proof</th>
                                                <th className="px-6 py-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {verifications.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{row.users?.full_name || 'Unknown'}</div>
                                                            <div className="text-xs text-gray-500">{row.users?.registration_no || row.student_id}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {row.competitions?.title || 'Unknown Event'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <a href={row.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">
                                                            View Proof
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 flex gap-2">
                                                        <button
                                                            onClick={() => handleVerify(row.id, 'APPROVED')}
                                                            className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerify(row.id, 'REJECTED')}
                                                            className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={20} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        No pending verifications found.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Competition Overview (Existing Logic) */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Active Competitions</h2>
                            {loading ? (
                                <div className="text-gray-500">Loading events...</div>
                            ) : competitions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        </div>
                    </div>

                    {/* Right Column - Alerts & Activity (Span 1) */}
                    <div className="space-y-6">

                        {/* Actionable Alerts */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Bell className="text-orange-500" size={20} />
                                <h3 className="font-bold text-gray-900">Actionable Alerts</h3>
                            </div>
                            <div className="space-y-4">
                                {/* Placeholder Alert */}
                                <div className="border-l-2 border-orange-200 pl-4 py-1">
                                    <p className="text-sm text-gray-800 font-medium">No urgent alerts</p>
                                    <p className="text-xs text-gray-500 mt-1">System is running smoothly</p>
                                </div>
                            </div>
                        </div>

                        {/* Approaches Deadlines */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="text-red-500" size={20} />
                                <h3 className="font-bold text-gray-900">Approaches Deadlines</h3>
                            </div>
                            <div className="space-y-3">
                                {/* Placeholder Deadline */}
                                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">Upcoming Event</div>
                                            <div className="text-xs text-red-600 mt-1">Jan 01</div>
                                        </div>
                                        <div className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded border border-red-100">
                                            - DAYS
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="text-blue-500" size={20} />
                                <h3 className="font-bold text-gray-900">Recent Activity</h3>
                            </div>
                            <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                {/* Placeholder Activity */}
                                <div className="relative pl-6">
                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-green-500 shadow-sm"></div>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium text-gray-900">System</span> initialized for new batch
                                    </p>
                                    <div className="text-xs text-gray-400 mt-1">Just now</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default FacultyDashboard;
