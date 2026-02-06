import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadProofModal from '../../components/common/UploadProofModal';
import StudentSidebar from './Sidebar';
import CompetitionListView from '../common/CompetitionListView';
import { supabase } from '../../services/supabaseClient';
import { studentService } from '../../services/studentService';
import { RefreshCw } from 'lucide-react';

const StudentCompetitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedCompId, setSelectedCompId] = useState(null);
    const [selectedTeamId, setSelectedTeamId] = useState(null);

    const fetchCompetitions = async () => {
        setLoading(true);
        try {
            const data = await studentService.getAllCompetitions();
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

    const [activeTab, setActiveTab] = useState('unregistered');

    const [appliedCompetitions, setAppliedCompetitions] = useState(() => {
        const saved = localStorage.getItem('appliedCompetitions');
        return saved ? JSON.parse(saved) : {};
    });

    const handleToggleApplied = (compId) => {
        setAppliedCompetitions(prev => {
            const newState = { ...prev, [compId]: !prev[compId] };
            localStorage.setItem('appliedCompetitions', JSON.stringify(newState));
            return newState;
        });
    };

    const [selectedProofType, setSelectedProofType] = useState(null);

    const handleRegisterClick = (compId, proofType = 'REGISTERED') => {
        setSelectedCompId(compId);
        setSelectedProofType(proofType);
        setIsUploadModalOpen(true);
    };

    const navigate = useNavigate(); // Hook needs to be imported

    const handleRequestOD = (compId) => {
        navigate(`/student/od-request/${compId}`);
    };

    const handleUploadProofSubmit = async (compIdOrTeamId, proofUrl, proofType) => {
        try {
            if (selectedTeamId) {
                // Team Mode - (Assuming Team Proofs are always 'Registered' for now, or update later if needed)
                await studentService.uploadTeamProof(selectedTeamId, proofUrl);
                alert("Team Proof uploaded! Waiting for faculty verification.");
            } else {
                // Individual Mode
                await studentService.uploadProof(compIdOrTeamId, proofUrl, proofType);
                alert("Proof uploaded! Waiting for faculty approval.");
            }
            fetchCompetitions();
        } catch (err) {
            console.error("Upload process error:", err);
            alert("An error occurred: " + err.message);
        }
    };

    // Filter Logic based on tabs
    const filteredCompetitions = competitions.filter(c => {
        if (activeTab === 'registered') {
            return c.my_registration;
        } else {
            // For Unregistered: Hide if registered OR if Closed
            const deadline = new Date(c.registration_deadline || c.deadline);
            deadline.setHours(23, 59, 59, 999);
            const isClosed = deadline < new Date();

            return !c.my_registration && !isClosed;
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

    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <StudentSidebar />
            <div className="flex-1 ml-0 md:ml-sidebar p-4 md:p-8">

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
                            <span>Faculty Last Synced: {latestSyncTime.toLocaleString()}</span>
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
                    cardActions={{
                        onRegister: handleRegisterClick,
                        onRequestOD: handleRequestOD,
                        onToggleApplied: handleToggleApplied
                    }}
                    appliedCompetitions={appliedCompetitions}
                />
            </div>

            <UploadProofModal
                isOpen={isUploadModalOpen}
                onClose={() => { setIsUploadModalOpen(false); setSelectedTeamId(null); setSelectedProofType(null); }}
                competitionId={selectedCompId}
                onSubmit={handleUploadProofSubmit}
                title={selectedTeamId ? "Upload Team Proof" : "Upload Registration Proof"}
                defaultProofType={selectedProofType}
            />
        </div>
    );
};

export default StudentCompetitions;
