import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Menu } from 'lucide-react';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';
import StudentSidebar from './Sidebar';
import { supabase } from '../../services/supabaseClient';
import { api } from '../../services/api';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const fetchCompetitions = async () => {
        setLoading(true);
        try {
            const data = await api.get('/api/student/competitions');
            setCompetitions(data || []);
        } catch (err) {
            console.error('Error fetching competitions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompetitions();
    }, []);

    // Handlers
    const handleCheckStatus = async (compId) => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const providerToken = session?.provider_token;

        if (!providerToken) {
            alert("Gmail Access Token missing. Please Sign Out and Sign In again with Google.");
            setLoading(false);
            return;
        }

        try {
            const resData = await api.post('/api/student/check-status', {
                competition_id: compId,
                provider_token: providerToken
            });

            if (resData.verified) {
                alert("Success! Verified registration via Gmail.");
                fetchCompetitions();
            } else if (resData.status === 'NOT_FOUND') {
                console.log("Debug Info:", JSON.stringify(resData.debug, null, 2));
                alert("Gmail verification failed. No matching email found from the organizer.");
            } else {
                alert("Verification status: " + resData.status);
                fetchCompetitions();
            }
        } catch (err) {
            console.error("Verification error:", err);
            alert(`Verification failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };



    const handleRequestOD = async (compId) => {
        const reason = prompt("Enter reason for OD request:");
        if (!reason) return;

        try {
            await api.post('/api/student/request-od', { competition_id: compId, reason });
            alert("OD Request Sent to HOD.");
            fetchCompetitions();
        } catch (err) {
            alert(`Request failed: ${err.message}`);
        }
    };

    return (
        <div className="flex bg-background min-h-screen text-foreground font-sans">
            <StudentSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 md:ml-sidebar">
                {/* Mobile Header */}
                <div className="md:hidden bg-card border-b border-border p-4 flex items-center gap-4 sticky top-0 z-20">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg">Student Dashboard</span>
                </div>

                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {/* Header */}
                    <div className="mb-8 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Welcome back !</h1>
                            <p className="text-muted mt-1">Here's what's happening with your competitions.</p>
                        </div>
                    </div>

                    <section className="mb-10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-foreground">Upcoming Deadlines (Next 2 Days)</h2>
                            <button onClick={() => navigate('/student/competitions')} className="text-sm text-brand-600 hover:underline">View All</button>
                        </div>

                        {competitions.filter(comp => {
                            if (!comp.registration_deadline) return false;
                            if (!comp.my_registration) return false;
                            const deadline = new Date(comp.registration_deadline);
                            const now = new Date();
                            const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
                            const diff = deadline - now;
                            return diff > 0 && diff <= twoDaysInMs;
                        }).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {competitions.filter(comp => {
                                    if (!comp.registration_deadline) return false;
                                    if (!comp.my_registration) return false;
                                    const deadline = new Date(comp.registration_deadline);
                                    const now = new Date();
                                    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
                                    const diff = deadline - now;
                                    return diff > 0 && diff <= twoDaysInMs;
                                }).map((comp) => (
                                    <CompetitionCard
                                        key={comp.id}
                                        competition={comp}
                                        onRegister={() => navigate('/student/competitions')}
                                        onVerifyGmail={handleCheckStatus}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-card p-8 rounded-xl border border-border text-center shadow-sm">
                                <Clock className="mx-auto text-muted mb-2" size={32} />
                                <p className="text-muted">No registered competitions ending within 2 days.</p>
                            </div>
                        )}
                    </section>

                    <div className="grid grid-cols-1 gap-8">
                        {/* Your Competitions List */}
                        <div className="col-span-1">
                            <h2 className="text-lg font-semibold text-foreground mb-4">Your Competitions</h2>

                            {competitions.filter(c => c.my_registration).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {competitions.filter(c => c.my_registration).map((comp) => (
                                        <CompetitionCard
                                            key={comp.id}
                                            competition={comp}
                                            onRegister={() => navigate('/student/competitions')}
                                            onRequestOD={handleRequestOD}
                                            onVerifyGmail={handleCheckStatus}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-8">
                                    <div className="w-16 h-16 bg-muted/10 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-3">
                                        <span className="text-2xl">🏆</span>
                                    </div>
                                    <h3 className="text-foreground font-medium">No active competitions</h3>
                                    <p className="text-muted text-sm mt-1 mb-4">You haven't registered for any events yet.</p>
                                    <button
                                        onClick={() => navigate('/student/competitions')}
                                        className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition"
                                    >
                                        Browse Competitions
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
