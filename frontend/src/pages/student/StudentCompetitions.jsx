import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadProofModal from '../../components/common/UploadProofModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import AlertModal from '../../components/common/AlertModal';
import { useToast } from '../../contexts/ToastContext';

import CompetitionDetails from '../common/CompetitionDetails';
import { formatDateTime } from '../../utils/dateFormatter';
import CompetitionListView from '../common/CompetitionListView';
import { supabase } from '../../services/supabaseClient';
import { studentService } from '../../services/studentService';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StudentCompetitions = () => {
    const { user } = useAuth();
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedCompId, setSelectedCompId] = useState(null);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [isShortlistUpload, setIsShortlistUpload] = useState(false);
    const { addToast } = useToast();
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const [resultConfirmModal, setResultConfirmModal] = useState({
        isOpen: false,
        compId: null
    });

    const showAlert = (title, message, type = 'info') => {
        setAlertConfig({ isOpen: true, title, message, type });
    };

    const fetchCompetitions = async () => {
        setLoading(true);
        try {
            const data = await studentService.getAllCompetitions();
            setCompetitions(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) {
            console.error('Error fetching competitions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompetitions();
    }, [user?.id]);

    const [activeTab, setActiveTab] = useState('unregistered');

    const [appliedCompetitions, setAppliedCompetitions] = useState({});

    useEffect(() => {
        if (user?.id && competitions.length > 0) {
            const cleaned = {};
            competitions.forEach(c => {
                if (c.is_temp_registered && !c.my_registration) {
                    cleaned[c.id] = c.temp_registered_at ? new Date(c.temp_registered_at).getTime() : Date.now();
                }
            });
            setAppliedCompetitions(cleaned);

            const times = competitions
                .map(c => c.last_synced_at)
                .filter(t => t)
                .map(t => new Date(t).getTime());
            const maxSync = times.length > 0 ? Math.max(...times) : 0;

            const unverifiedComps = competitions.filter(c => {
                const toggleVal = cleaned[c.id];
                if (!toggleVal || c.my_registration) return false;
                
                const syncTime = c.last_synced_at ? new Date(c.last_synced_at).getTime() : maxSync;
                const toggleTime = typeof toggleVal === 'number' ? toggleVal : 0;
                return syncTime > toggleTime;
            });

            if (unverifiedComps.length > 0 && !sessionStorage.getItem(`notified_temp_${user.id}`)) {
                sessionStorage.setItem(`notified_temp_${user.id}`, 'true');
                const messageList = unverifiedComps.map(c => 
                    `Even after the latest sync, your competition "${c.title}" is still showing as unregistered — even though you had marked it as temporarily registered. Please verify whether you completed your registration, or upload manual proof for faculty review.`
                ).join('\n\n');

                setAlertConfig({
                    isOpen: true,
                    title: "Post-Sync Registration Alert",
                    message: messageList,
                    type: "warning",
                    autoClose: false
                });
            }
        }
    }, [competitions, user?.id]);

    const handleToggleApplied = async (compId) => {
        if (!user?.id) return;
        const currentlyApplied = !!appliedCompetitions[compId];
        const nextState = !currentlyApplied;

        // Optimistic UI update
        setAppliedCompetitions(prev => {
            const newState = { ...prev };
            if (currentlyApplied) {
                delete newState[compId];
            } else {
                newState[compId] = Date.now();
            }
            return newState;
        });

        try {
            await studentService.toggleTempRegistration(compId, nextState);
        } catch (err) {
            console.error("Failed to sync temp registration to DB:", err);
            // Revert on failure
            setAppliedCompetitions(prev => {
                const newState = { ...prev };
                if (currentlyApplied) {
                    newState[compId] = Date.now();
                } else {
                    delete newState[compId];
                }
                return newState;
            });
        }
    };

    const [selectedProofType, setSelectedProofType] = useState(null);

    const handleRegisterClick = (compId, proofType = 'REGISTERED') => {
        setSelectedCompId(compId);
        setSelectedProofType(proofType);
        setIsShortlistUpload(proofType === 'QUALIFIED');
        setIsUploadModalOpen(true);
    };

    const navigate = useNavigate(); // Hook needs to be imported

    const handleRequestOD = (compId) => {
        navigate(`/student/od-request/${compId}`);
    };

    const handleAutoSync = (compId) => {
        addToast("Our auto-detect is still putting on its detective hat. Hang tight — Sherlock is almost ready!", "info");
        setAlertConfig({
            isOpen: true,
            title: 'Sherlock on the Case! 🕵️‍♂️',
            message: 'Our auto-detect is still putting on its detective hat. Hang tight — Sherlock is almost ready!',
            type: 'info',
            autoClose: true,
            duration: 3500
        });
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

    // Filter Logic based on tabs
    const filteredCompetitions = competitions.filter(c => {
        if (activeTab === 'registered') {
            // Only show if the registration is verified by faculty
            return c.my_registration && c.my_registration.verified;
        } else {
            // Unregistered Tab: ONLY show open competitions IF not registered at all
            if (!c.my_registration) {
                if (!c.registration_deadline) return true; // Keep if no deadline
                const deadline = new Date(c.registration_deadline);
                deadline.setHours(23, 59, 59, 999);
                return deadline >= new Date(); // Keep if not closed
            }
            // If they have a registration but it's not verified, it stays in Unregistered
            return !c.my_registration.verified;
        }
    });

    // Calculate Latest Sync Time
    const latestSyncTime = useMemo(() => {
        if (!competitions || competitions.length === 0) return null;
        const times = competitions
            .map(c => c.last_synced_at)
            .filter(t => t) // Remove nulls
            .map(t => new Date(t).getTime());

        if (times.length === 0) return null;
        return new Date(Math.max(...times));
    }, [competitions]);

    const cardActions = {
        onRegister: handleRegisterClick,
        onRequestOD: handleRequestOD,
        onToggleApplied: handleToggleApplied,
        onWonStatusUpdate: handleWonStatusUpdate,
        onAutoSync: handleAutoSync
    };

    return (
        <>
            {/* Header Section with Tabs and Sync Status */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 bg-muted/20 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('unregistered')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'unregistered'
                                ? 'bg-card text-primary shadow-sm'
                                : 'text-muted hover:text-foreground'
                                }`}
                        >
                            Unregistered
                        </button>
                        <button
                            onClick={() => setActiveTab('registered')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'registered'
                                ? 'bg-card text-primary shadow-sm'
                                : 'text-muted hover:text-foreground'
                                }`}
                        >
                            Registered
                        </button>
                    </div>

                    {/* Sync Time Box */}
                    {latestSyncTime && (
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100 shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <RefreshCw className="w-4 h-4" />
                            <span>Faculty Last Synced: {formatDateTime(latestSyncTime)}</span>
                        </div>
                    )}
                </div>

                <CompetitionListView
                    Sidebar={null} // We handle sidebar above
                    competitions={filteredCompetitions}
                    title={activeTab === 'registered' ? "My Registrations" : "Available Competitions"}
                    subtitle={activeTab === 'registered' ? "Competitions you have registered for." : "Browse and register for upcoming events."}
                    loading={loading}
                    showRegister={true} // Enable register buttons
                    role="STUDENT"
                    cardActions={cardActions}
                    appliedCompetitions={appliedCompetitions}
                />
            <UploadProofModal
                isOpen={isUploadModalOpen}
                onClose={() => { setIsUploadModalOpen(false); setSelectedTeamId(null); setSelectedProofType(null); }}
                competitionId={selectedCompId}
                onSubmit={handleUploadProofSubmit}
                title={selectedTeamId ? "Upload Team Proof" : "Upload Registration Proof"}
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

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                autoClose={alertConfig.autoClose !== undefined ? alertConfig.autoClose : true}
            />
        </>
    );
};

export default StudentCompetitions;
