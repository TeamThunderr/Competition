import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Menu, Trophy } from 'lucide-react';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';
import StudentSidebar from './Sidebar';
import UploadProofModal from '../../components/common/UploadProofModal';
import { supabase } from '../../services/supabaseClient';
import { api } from '../../services/api';
import { studentService } from '../../services/studentService';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedCompId, setSelectedCompId] = useState(null);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [selectedProofType, setSelectedProofType] = useState(null);
    const [isShortlistUpload, setIsShortlistUpload] = useState(false);
    const [selectedTeamData, setSelectedTeamData] = useState(null);
    const [odRequests, setOdRequests] = useState([]);
    const { addToast } = useToast();

    // Alert Modal
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { }
    });
    const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const fetchCompetitions = async () => {
        setLoading(true);
        try {
            const [competitionsData, odData] = await Promise.all([
                api.get('/api/student/competitions'),
                studentService.getMyODRequests()
            ]);
            setCompetitions(Array.isArray(competitionsData) ? competitionsData : (competitionsData?.data || []));
            setOdRequests(Array.isArray(odData) ? odData : (odData?.data || []));
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompetitions();
    }, []);

    // Derived State for OD Status Card
    const getODStatusCard = () => {
        const now = new Date();
        const activeOD = odRequests.find(od =>
            od.status === 'APPROVED' &&
            new Date(od.from_date) <= now &&
            new Date(od.to_date) >= now
        );

        const pendingOD = odRequests.find(od => od.status === 'PENDING');

        if (activeOD) {
            return (
                <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-800 dark:text-emerald-200">Active OD</h3>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 line-clamp-1">{activeOD.competitions?.title}</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                {new Date(activeOD.from_date).toLocaleDateString()} - {new Date(activeOD.to_date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Extension / Pending Alert inside Active Card */}
                    {pendingOD && (
                        <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                            <Clock size={16} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300">Extension Request Pending</h4>
                                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                    For {pendingOD.competitions?.title} ({new Date(pendingOD.from_date).toLocaleDateString()})
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        if (pendingOD) {
            return (
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-500/10 rounded-full text-amber-600 dark:text-amber-400">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-800 dark:text-amber-200">OD Request Pending</h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 line-clamp-1">{pendingOD.competitions?.title}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">Waiting for approval...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-gray-50 dark:bg-zinc-900 border border-border p-4 rounded-xl flex items-center gap-4 opacity-75">
                <div className="p-3 bg-gray-200 dark:bg-zinc-800 rounded-full text-gray-500 dark:text-zinc-400">
                    <Clock size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-foreground">No Active OD</h3>
                    <p className="text-sm text-muted">You are currently on campus.</p>
                </div>
            </div>
        );
    };

    const handleRequestOD = (compId) => {
        navigate(`/student/od-request/${compId}`);
    };

    const handleRegisterClick = (compId, proofType = 'REGISTERED') => {
        setSelectedCompId(compId);
        setSelectedProofType(proofType);
        setIsShortlistUpload(proofType === 'QUALIFIED');
        setIsUploadModalOpen(true);
    };

    const [resultConfirmModal, setResultConfirmModal] = useState({
        isOpen: false,
        compId: null
    });

    const handleAutoSync = async (compId) => {
        try {
            const statusRes = await studentService.checkGmailStatus();
            if (!statusRes.data?.connected) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Gmail Not Connected',
                    message: 'Please connect your Gmail in Settings to use Auto-Detect.',
                    type: 'warning',
                    onConfirm: () => {
                        closeConfirmModal();
                        navigate('/student/settings');
                    }
                });
                return;
            }
            
            addToast("Scanning Gmail for registration...", "info");
            const res = await studentService.checkStatus(compId, null);
            if (res.data?.status === 'REGISTERED' || res.data?.status === 'QUALIFIED') {
                addToast("Competition registered successfully from Gmail!", "success");
                fetchCompetitions();
            } else {
                setConfirmModal({
                    isOpen: true,
                    title: 'Not Found',
                    message: 'Could not find registration email. Try manual upload.',
                    type: 'warning',
                    onConfirm: closeConfirmModal
                });
            }
        } catch (err) {
            console.error("Auto-sync error", err);
            
            if (err.response?.status === 403 && err.response?.data?.reason === 'gmail_not_connected') {
                setConfirmModal({
                    isOpen: true,
                    title: 'Gmail Access Revoked',
                    message: 'Your Gmail access has expired or been revoked. Please reconnect in Settings.',
                    type: 'error',
                    onConfirm: () => {
                        closeConfirmModal();
                        navigate('/student/settings');
                    }
                });
            } else {
                setConfirmModal({
                    isOpen: true,
                    title: 'Sync Failed',
                    message: 'Failed to scan Gmail. ' + (err.response?.data?.error || err.message),
                    type: 'error',
                    onConfirm: closeConfirmModal
                });
            }
        }
    };

    const handleWonStatusUpdate = (compId) => {
        setResultConfirmModal({ isOpen: true, compId });
    };

    const submitResultUpdate = async (won) => {
        const compId = resultConfirmModal.compId;
        setResultConfirmModal({ isOpen: false, compId: null });

        if (!won) {
            try {
                await studentService.updateWinningStatus(compId, 'NOT_WON');
                addToast("Status updated to Participant", 'success');
                fetchCompetitions();
            } catch (err) {
                addToast("Failed to update status", 'error');
            }
        } else {
            setSelectedCompId(compId);
            setSelectedProofType('WINNER');
            setIsShortlistUpload(false);
            setIsUploadModalOpen(true);
        }
    };

    const handleUploadProofSubmit = async (compIdOrTeamId, file, proofType) => {
        try {
            if (isShortlistUpload || selectedTeamId || proofType === 'WINNER') {
                // Manual Upload Flow for Shortlist, Team, and Winner Proofs
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) throw new Error("User not authenticated");
                const studentId = user.id;

                const fileExt = file.name.split('.').pop();
                const prefix = proofType === 'WINNER' ? 'winning_' : (isShortlistUpload ? 'shortlist_' : 'team_');
                const fileName = `${prefix}${compIdOrTeamId}_${studentId}_${Date.now()}.${fileExt}`;
                const filePath = `proofs/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('proofs')
                    .upload(filePath, file);

                if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

                const { data: { publicUrl } } = supabase.storage
                    .from('proofs')
                    .getPublicUrl(filePath);

                const proofUrl = publicUrl;

                if (proofType === 'WINNER') {
                    await studentService.updateWinningStatus(compIdOrTeamId, 'WON', proofUrl);
                    addToast("Winning Proof uploaded! Waiting for faculty verification.", 'success');
                } else if (isShortlistUpload) {
                    await studentService.uploadShortlistProof(compIdOrTeamId, proofUrl);
                    addToast("Shortlist Proof uploaded! Waiting for faculty verification.", 'success');
                } else if (selectedTeamId) {
                    await studentService.uploadTeamProof(selectedTeamId, proofUrl);
                    addToast("Team Proof uploaded! Waiting for faculty verification.", 'success');
                }
            } else {
                // Individual Registration Mode
                await studentService.uploadProof(compIdOrTeamId, file, proofType);
                addToast("Proof uploaded! Waiting for faculty approval.", 'success');
            }
            fetchCompetitions();
            setIsUploadModalOpen(false);
        } catch (err) {
            console.error("Upload process error:", err);
            addToast("An error occurred: " + (err.message || 'Unknown error'), 'error');
        }
    };

    return (
        <>
            {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Welcome back !</h1>
                            <p className="text-muted mt-1">Here's what's happening with your competitions.</p>
                        </div>
                        <div className="md:w-1/3 w-full">
                            {getODStatusCard()}
                        </div>
                    </div>

                    <section className="mb-10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-foreground">Upcoming Deadlines (Next 2 Days)</h2>
                            <button onClick={() => navigate('/student/competitions')} className="text-sm text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-3 py-1.5 rounded-lg transition-colors font-medium">View All</button>
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
                                        onWonStatusUpdate={handleWonStatusUpdate}
                                        onRegister={handleRegisterClick}
                                        onRequestOD={handleRequestOD}
                                        onAutoSync={handleAutoSync}
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
                                            onWonStatusUpdate={handleWonStatusUpdate}
                                            onRegister={handleRegisterClick}
                                            onRequestOD={handleRequestOD}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-8">
                                    <div className="w-16 h-16 bg-muted/10 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-3">
                                        <Trophy className="text-brand-500" size={32} />
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
            <UploadProofModal
                isOpen={isUploadModalOpen}
                onClose={() => { setIsUploadModalOpen(false); setSelectedTeamId(null); setSelectedProofType(null); }}
                competitionId={selectedCompId}
                onSubmit={handleUploadProofSubmit}
                title={selectedProofType === 'WINNER' ? "Upload Winning Proof" : (selectedTeamId ? "Upload Team Proof" : "Upload Registration Proof")}
                defaultProofType={selectedProofType}
            />

            <ConfirmModal
                isOpen={resultConfirmModal.isOpen}
                onClose={() => setResultConfirmModal({ isOpen: false, compId: null })}
                onConfirm={() => submitResultUpdate(true)}
                title="Did you win?"
                message="Congratulations on completing the competition! Did you secure a prize (Won) or participate? If you won, you'll need to upload proof."
                type="success"
                confirmText="Yes, I WON"
                cancelText="No, just Participated"
                onCancel={() => submitResultUpdate(false)}
            />
            {/* Global Alert Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText="Okay"
                cancelText="Close"
            />
        </>
    );
};

export default StudentDashboard;
