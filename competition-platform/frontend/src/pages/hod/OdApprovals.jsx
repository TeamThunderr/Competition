import React, { useState, useEffect } from 'react';
import HodLayout from './HodLayout';
import { ShieldCheck, Check, X, Calendar, ChevronRight, ExternalLink } from 'lucide-react';
import { getPendingODRequests, manageODRequest } from '../../services/hodService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const OdApprovals = () => {
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleBulkAction = async (status) => {
        if (window.confirm(`Are you sure you want to ${status} ${selectedIds.length} requests?`)) {
            try {
                // Execute in parallel
                await Promise.all(selectedIds.map(id => manageODRequest(id, status)));
                setPendingApprovals(prev => prev.filter(od => !selectedIds.includes(od.id)));
                setSelectedIds([]);
            } catch (error) {
                console.error(`Bulk ${status} failed`, error);
                alert(`Failed to complete bulk action. Please try again.`);
            }
        }
    };

    useEffect(() => {
        const fetchODs = async () => {
            try {
                const data = await getPendingODRequests();
                setPendingApprovals(data || []);
            } catch (error) {
                console.error("Failed to fetch OD requests", error);
            } finally {
                setLoading(false);
            }
        };
        fetchODs();
    }, []);

    const handleAction = async (id, status, overrides = {}) => {
        try {
            await manageODRequest(id, status, overrides);
            setPendingApprovals(prev => prev.filter(od => od.id !== id));
            setSelectedRequest(null); // Close modal if open
        } catch (error) {
            console.error(`Failed to ${status} OD request`, error);
        }
    };

    return (
        <HodLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between items-start mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">OD Approval Queue</h1>
                    <p className="text-muted mt-1">Verify official email evidence and grant On-Duty permissions.</p>
                </div>

                <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg flex items-center space-x-2 w-full md:w-auto justify-center dark:bg-blue-900/30 dark:border-blue-900/50">
                    <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Automated DKIM Verification Active</span>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* Bulk Actions Bar */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl z-40 flex items-center gap-6 animate-in slide-in-from-bottom-5">
                        <span className="text-sm font-medium">{selectedIds.length} selected</span>
                        <div className="h-4 w-px bg-gray-700"></div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkAction('REJECTED')}
                                className="px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                REJECT ALL
                            </button>
                            <button
                                onClick={() => handleBulkAction('APPROVED')}
                                className="px-3 py-1.5 text-xs font-bold text-green-400 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                APPROVE ALL
                            </button>
                        </div>
                        <button onClick={() => setSelectedIds([])} className="ml-2 text-gray-500 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-12">
                        <RoleBasedLoader role="HOD" />
                    </div>
                ) : pendingApprovals.length > 0 ? (
                    pendingApprovals.map(approval => (
                        <div
                            key={approval.id}
                            onClick={() => setSelectedRequest(approval)}
                            className="bg-card rounded-xl border border-border p-6 flex justify-between items-center shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
                        >
                            <div>
                                <div className="flex items-center space-x-3 mb-1">
                                    <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">{approval.users?.full_name || 'Unknown Student'}</h3>
                                    <span className="bg-muted/10 text-muted text-xs px-2 py-0.5 rounded-full border border-border">
                                        {approval.users?.registration_no}
                                    </span>
                                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50">
                                        Sec {approval.users?.section}
                                    </span>
                                </div>
                                <div className="text-sm text-muted flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <span className="flex items-center space-x-1">
                                        <ShieldCheck size={14} />
                                        <span>{approval.competitions?.title || 'External Event'}</span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500">
                                    <div className="flex items-center space-x-2">
                                        <ShieldCheck size={16} className="text-gray-400" />
                                        <span className="truncate font-medium text-gray-700">{approval.competitions?.title || 'External Event'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span>{approval.competitions?.event_date ? new Date(approval.competitions.event_date).toLocaleDateString() : 'Date N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 border-l border-gray-100 pl-4 w-32">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAction(approval.id, 'APPROVED'); }}
                                    className="w-full py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <Check size={14} />
                                    Approve
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAction(approval.id, 'REJECTED'); }}
                                    className="w-full py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-card rounded-xl border border-border p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck size={32} className="text-muted" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">No Pending Approvals</h3>
                        <p className="text-muted mt-2">All OD requests have been processed.</p>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
                    <div
                        className="bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/5">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Request Details</h2>
                                <p className="text-sm text-muted">Review request before approval</p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="text-muted hover:text-foreground p-1 bg-card rounded-full border border-border shadow-sm transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Student Info Block */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg dark:bg-blue-900/30 dark:text-blue-300">
                                    {selectedRequest.users?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground text-lg leading-tight">{selectedRequest.users?.full_name}</h3>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted">
                                        <span>{selectedRequest.users?.registration_no}</span>
                                        <span className="w-1 h-1 bg-muted/50 rounded-full"></span>
                                        <span className="text-blue-600 font-medium dark:text-blue-400">Sec {selectedRequest.users?.section}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Event Info & OD Date Range */}
                            <div className="bg-muted/5 p-4 rounded-xl border border-border space-y-4">
                                <div>
                                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Competition/Event</span>
                                    <p className="font-medium text-foreground mt-1 text-base">{selectedRequest.competitions?.title || 'External Event'}</p>
                                    {selectedRequest.competitions?.event_date && (
                                        <p className="text-xs text-muted mt-0.5">
                                            Event Date: {new Date(selectedRequest.competitions.event_date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                {/* OD Date Range */}
                                <div className="pt-3 border-t border-border">
                                    <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Requested OD Period</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                            <span className="text-xs text-muted block">From</span>
                                            <span className="font-semibold text-foreground text-sm">
                                                {selectedRequest.from_date ? new Date(selectedRequest.from_date).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        <span className="text-muted">→</span>
                                        <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                            <span className="text-xs text-muted block">To</span>
                                            <span className="font-semibold text-foreground text-sm">
                                                {selectedRequest.to_date ? new Date(selectedRequest.to_date).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* HOD Overrides / Settings */}
                                { /* HOD Overrides / Settings */}
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                                    <div>
                                        <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Time Slot</label>
                                        <select
                                            id="od-time-slot"
                                            className="w-full text-sm p-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                                            defaultValue="Full Day"
                                        >
                                            <option value="Full Day">Full Day</option>
                                            <option value="First Half">First Half (Morning)</option>
                                            <option value="Second Half">Second Half (Afternoon)</option>
                                            <option value="After Break">After Break (10:30 AM+)</option>
                                            <option value="After Lunch">After Lunch (1:30 PM+)</option>
                                        </select>
                                    </div>

                                    {!selectedRequest.competitions?.event_date && (
                                        <div>
                                            <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Duration (Days)</label>
                                            <input
                                                id="od-duration"
                                                type="number"
                                                min="1"
                                                defaultValue="10"
                                                className="w-full text-sm p-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Team Context Block */}
                            {selectedRequest.teams && (
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-2">
                                    <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Team Context</h4>
                                    <div className="flex justify-between items-center text-sm">
                                        <div>
                                            <span className="text-gray-500 block text-xs">Team Name</span>
                                            <span className="font-medium text-gray-900">{selectedRequest.teams.team_name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-gray-500 block text-xs">Verification</span>
                                            <span className={`font-bold ${selectedRequest.teams.verification_status === 'VERIFIED' ? 'text-green-600' : 'text-orange-600'}`}>
                                                {selectedRequest.teams.verification_status}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedRequest.teams.proof_url && (
                                        <div className="pt-2">
                                            <a
                                                href={selectedRequest.teams.proof_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 font-medium"
                                            >
                                                <ExternalLink size={12} /> View Team Proof
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reason Block */}
                            <div>
                                <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Detailed Reason</span>
                                <div className="bg-blue-50/50 p-4 rounded-xl text-foreground text-sm leading-relaxed border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30">
                                    {selectedRequest.reason || "No specific reason provided."}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-muted/5 border-t border-border flex gap-3">
                            <button
                                onClick={() => handleAction(selectedRequest.id, 'REJECTED')}
                                className="flex-1 py-2.5 text-sm font-medium text-red-600 bg-card hover:bg-red-50 rounded-lg transition-colors border border-border shadow-sm dark:bg-card dark:hover:bg-red-900/20"
                            >
                                Reject Request
                            </button>
                            <button
                                onClick={() => {
                                    const timeSlot = document.getElementById('od-time-slot')?.value;
                                    const duration = document.getElementById('od-duration')?.value;
                                    handleAction(selectedRequest.id, 'APPROVED', { timeSlot, duration });
                                }}
                                className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                <span>Approve OD</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </HodLayout>
    );
};

export default OdApprovals;
