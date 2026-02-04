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

    // Handlers
    const handleCheckStatus = async (compId) => {
        // We set loading true locally or use a transient state, but re-fetching handles UI update
        // setLoading(true); // Optional: global loading or specific card loading? View doesn't support card-specific loading yet.

        const { data: { session } } = await supabase.auth.getSession();
        const providerToken = session?.provider_token;

        if (!providerToken) {
            alert("Gmail Access Token missing. Please Sign Out and Sign In again with Google.");
            return;
        }

        try {
            const resData = await studentService.checkStatus(compId, providerToken);

            if (resData.verified) {
                alert("Success! Verified registration via Gmail.");
                fetchCompetitions();
            } else if (resData.status === 'NOT_FOUND') {
                alert("Gmail verification failed. No matching email found.");
            } else {
                alert("Status: " + resData.status);
                fetchCompetitions();
            }
        } catch (err) {
            console.error("Verification error:", err);
        }
    };

    const handleRegisterClick = (compId) => {
        setSelectedCompId(compId);
        setIsUploadModalOpen(true);
    };



    const navigate = useNavigate(); // Hook needs to be imported

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

    const [activeTab, setActiveTab] = useState('unregistered'); // 'unregistered' | 'registered'

    // Filter Logic specific to Student View
    const availableCompetitions = competitions.filter(c => {
        if (activeTab === 'registered') {
            return c.my_registration; // Show only if registered
        }
        return !c.my_registration; // Show only if NOT registered
    });

    return (
        <>
            <CompetitionListView
                Sidebar={StudentSidebar}
                competitions={availableCompetitions}
                title={activeTab === 'registered' ? "My Registrations" : "All Competitions"}
                subtitle={activeTab === 'registered' ? "Track your registered events." : "Browse and register for upcoming events."}
                loading={loading}
                showRegister={true} // Enable register buttons
                role="STUDENT"
                cardActions={{
                    onRegister: handleRegisterClick,
                    onRequestOD: handleRequestOD,
                    onVerifyGmail: handleCheckStatus
                }}
            >
                {/* Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('unregistered')}
                        className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'unregistered'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Unregistered
                    </button>
                    <button
                        onClick={() => setActiveTab('registered')}
                        className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'registered'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Registered
                    </button>
                </div>
            </CompetitionListView>

            <UploadProofModal
                isOpen={isUploadModalOpen}
                onClose={() => { setIsUploadModalOpen(false); setSelectedTeamId(null); }}
                competitionId={selectedCompId}
                onSubmit={handleUploadProofSubmit}
                title={selectedTeamId ? "Upload Team Proof" : "Upload Registration Proof"}
            />
        </>
    );
};

export default StudentCompetitions;
