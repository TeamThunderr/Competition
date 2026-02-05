import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { CheckCircle, XCircle, ExternalLink, Users, FileText } from 'lucide-react';
import { getPendingVerifications, getPendingTeamVerifications, verifyRegistration } from '../../services/facultyService';
import { api } from '../../services/api'; // Direct API for team verification if service not unified
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const FacultyVerify = () => {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // ID of item being processed

    const fetchPending = async () => {
        setLoading(true);
        try {
            // USER REQUEST: Page must be blank. No fetching.
            // const [regs, teams] = await Promise.all([
            //     getPendingVerifications(),
            //     getPendingTeamVerifications()
            // ]);

            // // Normalize Data
            // const normalizedRegs = (regs || []).map(r => ({ ...r, type: 'REGISTRATION' }));
            // const normalizedTeams = (teams || []).map(t => ({
            //     id: t.id,
            //     competitions: { title: t.competitionName },
            //     users: {
            //         full_name: t.leaderName,
            //         registration_no: t.leaderRollNo,
            //         section: t.leaderSection
            //     },
            //     proof_url: t.proofUrl, // Or proof_urls[0]? Backwards compat.
            //     created_at: t.submittedAt,
            //     type: 'TEAM_PROOF',
            //     raw: t // Keep raw data if needed
            // }));

            // setPending([...normalizedRegs, ...normalizedTeams]);
            setPending([]); // Force Empty
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (item, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;

        setActionLoading(item.id);
        try {
            if (item.type === 'REGISTRATION') {
                await verifyRegistration(item.id, status);
            } else {
                // Team Verification
                const action = status === 'approve' ? 'VERIFIED' : 'REJECTED';
                await api.post('/api/faculty/verify-team', {
                    team_id: item.id,
                    action: action
                });
            }

            // Remove from list
            setPending(prev => prev.filter(p => p.id !== item.id));
        } catch (err) {
            console.error(err);
            alert("Failed to process request.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <Sidebar />

            <main className="flex-1 md:ml-sidebar p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Pending Actions</h1>
                    <p className="text-gray-500 mt-2">Verify student team registrations.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <RoleBasedLoader role="FACULTY" />
                    </div>
                ) : pending.length === 0 ? (
                    <div className="bg-card rounded-xl border border-border p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
                        <p className="text-gray-500 mt-2">No pending requests.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {pending.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row relative">
                                {/* Type Badge */}
                                <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg z-10 ${item.type === 'TEAM_PROOF' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {item.type === 'TEAM_PROOF' ? 'TEAM PROOF' : 'REGISTRATION'}
                                </div>

                                {/* Proof Image Preview */}
                                <div className="w-full md:w-64 h-48 md:h-auto bg-gray-100 md:border-r border-gray-100 relative group text-center flex items-center justify-center">
                                    {item.proof_url ? (
                                        <>
                                            <img
                                                src={item.proof_url}
                                                alt="Proof"
                                                className="w-full h-full object-cover"
                                            />
                                            <a
                                                href={item.proof_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <div className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 cursor-pointer">
                                                    <ExternalLink size={16} />
                                                    View Proof
                                                </div>
                                            </a>
                                        </>
                                    ) : (
                                        <div className="text-gray-400 text-sm">No Proof Uploaded</div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 p-6 flex flex-col justify-center">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        {item.competitions?.title || 'Unknown Competition'}
                                    </h3>

                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 block">Student / Leader</span>
                                            <span className="font-medium">{item.users?.full_name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Reg / Roll No</span>
                                            <span className="font-medium">{item.users?.registration_no || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Class/Section</span>
                                            <span className="font-medium">{item.users?.section || 'N/A'}</span>
                                        </div>
                                        {item.type === 'OD_REQUEST' && (
                                            <div>
                                                <span className="text-gray-500 block">Team Name</span>
                                                <span className="font-medium text-purple-700">{item.raw?.teamName || 'Individual'}</span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-500 block">Submitted At</span>
                                            <span className="font-medium">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-6 bg-muted/5 border-t md:border-t-0 md:border-l border-border flex flex-row md:flex-col justify-center gap-3 w-full md:w-48">
                                    <button
                                        onClick={() => handleAction(item, 'approve')}
                                        disabled={actionLoading === item.id}
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {actionLoading === item.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckCircle size={16} />}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(item, 'reject')}
                                        disabled={actionLoading === item.id}
                                        className="flex-1 bg-card border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 dark:border-red-900 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        <XCircle size={16} />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default FacultyVerify;
