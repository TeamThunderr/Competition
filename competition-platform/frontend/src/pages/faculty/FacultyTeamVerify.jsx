import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { CheckCircle, XCircle, ExternalLink, Users } from 'lucide-react';
import { api } from '../../services/api';
// Assuming we might need to add service methods or use api directly. 
// Ideally we add to facultyService, but for brevity using api directly here or will verify import availability.
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const FacultyTeamVerify = () => {
    const [pendingTeams, setPendingTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPendingTeams = async () => {
        setLoading(true);
        try {
            // Using direct API call if service not updated yet, or update service later
            const response = await api.get('/api/faculty/pending-teams');
            if (response.success) {
                setPendingTeams(response.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch teams", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingTeams();
    }, []);

    const handleAction = async (teamId, action) => {
        // action: 'VERIFIED' or 'REJECTED'
        if (!window.confirm(`Are you sure you want to ${action} this team?`)) return;

        setActionLoading(teamId);
        try {
            const response = await api.post('/api/faculty/verify-team', {
                team_id: teamId,
                action: action
            });

            if (response.success) {
                // Update status in list to show badge immediatey
                setPendingTeams(prev => prev.map(t =>
                    t.id === teamId ? { ...t, verificationStatus: action } : t
                ));
            }
        } catch (err) {
            console.error(err);
            alert("Failed to process team verification.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
            <Sidebar />

            <main className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Team Verifications</h1>
                    <p className="text-gray-500 mt-2">Verify proof documents uploaded by Team Leaders.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <RoleBasedLoader role="FACULTY" />
                    </div>
                ) : pendingTeams.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                            <Users size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Pending Teams</h3>
                        <p className="text-gray-500 mt-2">All team proofs have been verified.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {pendingTeams.map((team) => (
                            <div key={team.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
                                {/* Proof Preview */}
                                <div className="w-full md:w-64 h-48 md:h-auto bg-gray-100 md:border-r border-gray-100 relative group flex items-center justify-center">
                                    {/* Try to show image if url suggests image, else show file icon */}
                                    {team.proofUrl && (team.proofUrl.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                                        <>
                                            <img
                                                src={team.proofUrl}
                                                alt="Proof"
                                                className="w-full h-full object-cover"
                                            />
                                            <a
                                                href={team.proofUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <div className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                                    <ExternalLink size={16} />
                                                    View Proof
                                                </div>
                                            </a>
                                        </>
                                    ) : (
                                        <a
                                            href={team.proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 text-blue-600 hover:text-blue-800"
                                        >
                                            <ExternalLink size={32} />
                                            <span className="font-medium text-sm">Open File</span>
                                        </a>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 p-6 flex flex-col justify-center">
                                    <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{team.competitionName}</p>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 block">Team Leader</span>
                                            <span className="font-medium">{team.leaderName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Roll No</span>
                                            <span className="font-medium">{team.leaderRollNo}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Class/Section</span>
                                            <span className="font-medium">Section {team.leaderSection}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Submitted At</span>
                                            <span className="font-medium">{team.submittedAt}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-6 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 flex flex-row md:flex-col justify-center gap-3 w-full md:w-48">
                                    {team.verificationStatus === 'VERIFIED' ? (
                                        <div className="flex flex-col items-center justify-center h-full text-green-600 font-bold gap-2">
                                            <CheckCircle size={32} />
                                            <span>VERIFIED</span>
                                        </div>
                                    ) : team.verificationStatus === 'REJECTED' ? (
                                        <div className="flex flex-col items-center justify-center h-full text-red-600 font-bold gap-2">
                                            <XCircle size={32} />
                                            <span>REJECTED</span>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleAction(team.id, 'VERIFIED')}
                                                disabled={actionLoading === team.id}
                                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                {actionLoading === team.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckCircle size={16} />}
                                                Verify
                                            </button>
                                            <button
                                                onClick={() => handleAction(team.id, 'REJECTED')}
                                                disabled={actionLoading === team.id}
                                                className="flex-1 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <XCircle size={16} />
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default FacultyTeamVerify;
