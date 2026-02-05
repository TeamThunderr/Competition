import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadProofModal from '../../components/common/UploadProofModal';
import StudentSidebar from './Sidebar';
import CompetitionListView from '../common/CompetitionListView';
import { supabase } from '../../services/supabaseClient';
import { studentService } from '../../services/studentService';

const StudentCompetitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedCompId, setSelectedCompId] = useState(null);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [isShortlistUpload, setIsShortlistUpload] = useState(false);

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



    const handleRegisterClick = (compId, isShortlist = false) => {
        setSelectedCompId(compId);
        setIsShortlistUpload(isShortlist);
        setIsUploadModalOpen(true);
    };



    const navigate = useNavigate(); // Hook needs to be imported

    const handleRequestOD = (compId) => {
        navigate(`/student/od-request/${compId}`);
    };

    const handleUploadProofSubmit = async (compIdOrTeamId, proofUrl) => {
        try {
            if (isShortlistUpload) {
                // Shortlist Verification Mode
                await studentService.uploadShortlistProof(compIdOrTeamId, proofUrl); // compIdOrTeamId is competitionId here
                alert("Shortlist Proof uploaded! Waiting for faculty verification.");
            } else if (selectedTeamId) {
                // Team Mode
                await studentService.uploadTeamProof(selectedTeamId, proofUrl);
                alert("Team Proof uploaded! Waiting for faculty verification.");
            } else {
                // Individual Mode
                await studentService.uploadProof(compIdOrTeamId, proofUrl);
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
            // Unregistered Tab: ONLY show open competitions
            if (!c.registration_deadline) return !c.my_registration; // Keep if no deadline

            const deadline = new Date(c.registration_deadline);
            deadline.setHours(23, 59, 59, 999);
            const isClosed = deadline < new Date();

            return !c.my_registration && !isClosed;
        }
    });

    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <StudentSidebar />
            <div className="flex-1 ml-0 md:ml-sidebar p-4 md:p-8">

                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-muted/20 p-1 rounded-xl w-fit">
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
                        onRequestOD: handleRequestOD
                    }}
                />
            </div>

            <UploadProofModal
                isOpen={isUploadModalOpen}
                onClose={() => { setIsUploadModalOpen(false); setSelectedTeamId(null); }}
                competitionId={selectedCompId}
                onSubmit={handleUploadProofSubmit}
                title={isShortlistUpload ? "Upload Shortlist Proof" : (selectedTeamId ? "Upload Team Proof" : "Upload Registration Proof")}
            />
        </div>
    );
};

export default StudentCompetitions;
