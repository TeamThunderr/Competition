import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Menu } from 'lucide-react';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';
import StudentSidebar from './Sidebar';
import UploadProofModal from '../../components/common/UploadProofModal';
import { supabase } from '../../services/supabaseClient';
import { api } from '../../services/api';
import { studentService } from '../../services/studentService';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedCompId, setSelectedCompId] = useState(null);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [selectedTeamData, setSelectedTeamData] = useState(null);

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





    const handleRequestOD = (compId) => {
        navigate(`/student/od-request/${compId}`);
    };

    const handleUploadProofSubmit = async (compIdOrTeamId, proofUrl) => {
        try {
            if (selectedTeamId) {
                // Team Mode
                await studentService.uploadTeamProof(selectedTeamId, proofUrl);
                alert("Team Proof uploaded! Waiting for faculty verification.");
            } else {
                // Individual Mode (Legacy or if needed here)
                // await studentService.uploadProof(compIdOrTeamId, proofUrl);
                alert("Proof uploaded!");
            }
            fetchCompetitions();
        } catch (err) {
            console.error("Upload process error:", err);
            alert("An error occurred: " + err.message);
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
                                        onRequestOD={handleRequestOD}
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
            <UploadProofModal
                isOpen={isUploadModalOpen}
                onClose={() => { setIsUploadModalOpen(false); setSelectedTeamId(null); }}
                competitionId={selectedCompId}
                onSubmit={handleUploadProofSubmit}
                title={selectedTeamId ? "Upload Team Proof" : "Upload Registration Proof"}
            />

        </div>
    );
};

export default StudentDashboard;
