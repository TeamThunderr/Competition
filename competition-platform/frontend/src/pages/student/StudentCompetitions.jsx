import React, { useEffect, useState } from 'react';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';
import UploadProofModal from '../../components/common/UploadProofModal';
import { getCurrentUser } from '../../services/authService';
import StudentSidebar from './Sidebar';
import { supabase } from '../../services/supabaseClient';
import { studentService } from '../../services/studentService';

const StudentCompetitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedCompId, setSelectedCompId] = useState(null);


    const fetchCompetitions = async () => {
        setLoading(true);
        try {
            const data = await studentService.getAllCompetitions();
            console.log("DEBUG: All Competitions:", data);
            console.log("DEBUG: Unregistered Count:", data?.filter(c => !c.my_registration).length);
            if (data && data.length > 0) {
                console.log("DEBUG: Sample Item:", data[0]);
                console.log("DEBUG: my_registration value:", data[0].my_registration);
            }
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
        } finally {
            setLoading(false);
        }
    };

    // Restore Modal Opener
    const handleRegisterClick = (compId) => {
        setSelectedCompId(compId);
        setIsUploadModalOpen(true);
    };

    // Modified to accept URL from Modal
    const handleUploadProof = async (compId, proofUrl) => {
        try {
            // Note: UploadProofModal handles the Storage upload. 
            // We just send the URL to the backend here.
            await studentService.uploadProof(compId, proofUrl);
            alert("Proof uploaded! Waiting for faculty approval.");
            fetchCompetitions();
        } catch (err) {
            console.error("Upload process error:", err);
            alert("An error occurred.");
        }
    };

    const handleRequestOD = async (compId) => {
        const reason = prompt("Enter reason for OD request:");
        if (!reason) return;

        try {
            await studentService.requestOD(compId, reason);
            alert("OD Request Sent to HOD.");
            fetchCompetitions();
        } catch (err) {
            alert(`Request failed: ${err.message}`);
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <StudentSidebar />

            <div className="flex-1 ml-64 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">All Competitions</h1>
                        <p className="text-gray-500 mt-1">Browse and register for upcoming events.</p>
                    </div>
                    <button onClick={fetchCompetitions} className="text-blue-600 text-sm font-medium hover:underline">Refresh Status</button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="text-gray-400">Loading events...</div>
                    </div>
                ) : competitions.filter(c => !c.my_registration).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {competitions.filter(c => !c.my_registration).map(comp => (
                            <CompetitionCard
                                key={comp.id}
                                competition={comp}
                                onRegister={handleRegisterClick}
                                onRequestOD={handleRequestOD}
                                onVerifyGmail={handleCheckStatus}
                            />

                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                        <div className="text-4xl mb-4">✨</div>
                        <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                        <p className="text-gray-500 mt-2">You have registered for all available competitions.</p>
                    </div>
                )}
            </div>
            <UploadProofModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                competitionId={selectedCompId}
                onSubmit={handleUploadProof}
            />
        </div>

    );
};

export default StudentCompetitions;
