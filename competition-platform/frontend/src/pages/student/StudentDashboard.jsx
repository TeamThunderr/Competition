import React, { useEffect, useState } from 'react';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';


const StudentDashboard = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCompetitions = async () => {
        setLoading(true);
        try {
            // Need user ID for headers
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : null;
            const userId = user?.id;

            if (!userId) {
                console.error("No user session found");
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
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;

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
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
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

        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
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
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Dashboard</h1>

            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Competitions</h2>
                    <button onClick={fetchCompetitions} className="text-blue-600 text-sm hover:underline">Refresh Status</button>
                </div>

                {loading ? (
                    <div className="text-gray-500">Loading events...</div>
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
                    <div className="text-gray-500 bg-white p-8 rounded-lg border text-center">
                        No competitions active at the moment.
                    </div>
                )}
            </section>
        </div>
    );
};

export default StudentDashboard;
