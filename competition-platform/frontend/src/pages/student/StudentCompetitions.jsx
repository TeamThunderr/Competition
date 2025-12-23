import React, { useEffect, useState } from 'react';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';
import { getCurrentUser } from '../../services/authService';
import StudentSidebar from './Sidebar';

const StudentCompetitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCompetitions = async () => {
        setLoading(true);
        try {
            // Need user ID for headers
            const user = getCurrentUser();
            const userId = user?.id;

            if (!userId) {
                console.error("No user ID found in localStorage");
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:5000/api/student/competitions', {
                headers: {
                    'x-user-id': userId // Pass ID for backend middleware
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCompetitions(data);
            } else {
                console.error('Failed to fetch competitions');
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompetitions();
    }, []);

    // Handlers
    const handleCheckStatus = async (compId) => {
        alert("Scanning your Gmail for registration confirmation... (Mock Service)");

        // Mock API Call
        const user = getCurrentUser();
        const response = await fetch('http://localhost:5000/api/student/check-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user?.id
            },
            body: JSON.stringify({ competition_id: compId })
        });

        const resData = await response.json();

        if (resData.status === 'NOT_FOUND') {
            const proofUrl = prompt("Gmail detection failed. Please paste the screenshot URL of your registration proof:");
            if (proofUrl) {
                handleUploadProof(compId, proofUrl);
            }
        } else {
            alert("Registration Detected via Gmail!");
            fetchCompetitions(); // Refresh
        }
    };

    const handleUploadProof = async (compId, proofUrl) => {
        const user = getCurrentUser();
        const response = await fetch('http://localhost:5000/api/student/upload-proof', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user?.id
            },
            body: JSON.stringify({ competition_id: compId, proof_url: proofUrl })
        });

        if (response.ok) {
            alert("Proof uploaded! Waiting for faculty approval.");
            fetchCompetitions();
        } else {
            alert("Upload failed.");
        }
    };

    const handleRequestOD = async (compId) => {
        const reason = prompt("Enter reason for OD request:");
        if (!reason) return;

        const user = getCurrentUser();
        const response = await fetch('http://localhost:5000/api/student/request-od', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user?.id
            },
            body: JSON.stringify({ competition_id: compId, reason })
        });

        if (response.ok) {
            alert("OD Request Sent to HOD.");
            fetchCompetitions();
        } else {
            alert("Request failed.");
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
                ) : competitions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {competitions.map(comp => (
                            <CompetitionCard
                                key={comp.id}
                                competition={comp}
                                onCheckStatus={handleCheckStatus}
                                onUploadProof={handleUploadProof}
                                onRequestOD={handleRequestOD}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                        <div className="text-4xl mb-4">🔍</div>
                        <h3 className="text-lg font-medium text-gray-900">No competitions found</h3>
                        <p className="text-gray-500 mt-2">Check back later for new events.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentCompetitions;
