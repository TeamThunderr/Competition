import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, RefreshCcw } from 'lucide-react';
import CompetitionCard from '../../components/features/competitions/CompetitionCard';
import StudentSidebar from './Sidebar';
import { scanInbox } from '../../services/gmailService';
import { supabase } from '../../services/supabaseClient';

const StudentDashboard = () => {
    const navigate = useNavigate();
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

    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);

    useEffect(() => {
        fetchCompetitions();
        // Automatic background scan
        handleGmailScan();
    }, []);

    const handleGmailScan = async () => {
        try {
            setSyncing(true);
            const { data: { session } } = await supabase.auth.getSession();
            const providerToken = session?.provider_token;

            if (providerToken) {
                console.log("Triggering auto-scan...");
                const result = await scanInbox(providerToken);
                console.log("Scan Result:", result);
                if (result.detectedCount > 0) {
                    // Ideally we should show a notification or update the UI with new detections
                    // For now, just re-fetch competitions if they were auto-added
                    // fetchCompetitions(); 
                }
                setLastSync(new Date());
            } else {
                console.log("No provider token found. Skipping Gmail scan.");
            }
        } catch (err) {
            console.error("Auto-scan failed:", err);
        } finally {
            setSyncing(false);
        }
    };

    // Handlers
    const handleCheckStatus = async (compId) => {
        // Checking status...

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

    const handleUploadProof = async (compId, file) => {
        try {
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : null;

            if (!file) return;

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${compId}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('proofs')
                .upload(fileName, file);

            if (uploadError) {
                console.error("Storage Upload Error:", uploadError);
                alert("Failed to upload image. Please try again.");
                return;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('proofs')
                .getPublicUrl(fileName);

            // 3. Send to Backend
            const response = await fetch('http://localhost:5000/api/student/upload-proof', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user?.id
                },
                body: JSON.stringify({ competition_id: compId, proof_url: publicUrl })
            });

            if (response.ok) {
                alert("Proof uploaded! Waiting for faculty approval.");
                fetchCompetitions();
            } else {
                alert("Upload failed.");
            }
        } catch (err) {
            console.error("Upload process error:", err);
            alert("An error occurred.");
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
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <StudentSidebar />

            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Welcome back !</h1>
                        <p className="text-gray-500 mt-1">Here's what's happening with your competitions.</p>
                    </div>
                    {syncing ? (
                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse">
                            <RefreshCcw size={14} className="animate-spin" />
                            Scanning Inbox...
                        </div>
                    ) : lastSync && (
                        <div className="text-xs text-gray-400">
                            Last synced: {lastSync.toLocaleTimeString()}
                        </div>
                    )}
                </div>

                <section className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines (Next 2 Days)</h2>
                        <button onClick={() => navigate('/student/competitions')} className="text-sm text-blue-600 hover:underline">View All</button>
                    </div>

                    {competitions.filter(comp => {
                        if (!comp.registration_deadline) return false;
                        const deadline = new Date(comp.registration_deadline);
                        const now = new Date();
                        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
                        const diff = deadline - now;
                        return diff > 0 && diff <= twoDaysInMs;
                    }).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {competitions.filter(comp => {
                                if (!comp.registration_deadline) return false;
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
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-xl border border-gray-100 text-center shadow-sm">
                            <Clock className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-gray-500">No competitions ending within 2 days.</p>
                        </div>
                    )}
                </section>

                <div className="grid grid-cols-1 gap-8">
                    {/* Your Competitions List */}
                    <div className="col-span-1">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Competitions</h2>

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
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-8">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                    <span className="text-2xl">🏆</span>
                                </div>
                                <h3 className="text-gray-900 font-medium">No active competitions</h3>
                                <p className="text-gray-500 text-sm mt-1 mb-4">You haven't registered for any events yet.</p>
                                <button
                                    onClick={() => navigate('/student/competitions')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                >
                                    Browse Competitions
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
