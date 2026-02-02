import React, { useState, useEffect } from 'react';
import HodLayout from './HodLayout';
import { ShieldCheck, Check, X, Calendar } from 'lucide-react';
import { getPendingODRequests, manageODRequest } from '../../services/hodService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const OdApprovals = () => {
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);

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
                                    <span className="flex items-center space-x-1">
                                        <Calendar size={14} />
                                        <span>{approval.competitions?.event_date ? new Date(approval.competitions.event_date).toLocaleDateString() : 'Date N/A'}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <span className="text-xs text-gray-400 font-medium mr-2 group-hover:text-blue-500 hidden sm:inline">View Details &rarr;</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAction(approval.id, 'REJECTED'); }}
                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAction(approval.id, 'APPROVED'); }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2 shadow-sm"
                                >
                                    <Check size={16} />
                                    <span className="hidden sm:inline">Approve</span>
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

                            {/* Event Info & Approval Settings */}
                            <div className="bg-muted/5 p-4 rounded-xl border border-border space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-xs font-semibold text-muted uppercase tracking-wider">Event</span>
                                        <p className="font-medium text-foreground mt-0.5">{selectedRequest.competitions?.title}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold text-muted uppercase tracking-wider">Date</span>
                                        <p className="font-medium text-foreground mt-0.5">
                                            {selectedRequest.competitions?.event_date
                                                ? new Date(selectedRequest.competitions.event_date).toLocaleDateString()
                                                : <span className="text-orange-600">TBA</span>}
                                        </p>
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
