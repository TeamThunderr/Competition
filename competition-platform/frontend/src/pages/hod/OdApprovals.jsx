import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HodLayout from './HodLayout';
import { ShieldCheck, Check, X, Calendar, ChevronRight, ExternalLink } from 'lucide-react';
import { getPendingODRequests, manageODRequest } from '../../services/hodService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const OdApprovals = () => {
    const navigate = useNavigate();
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [selectedRequest, setSelectedRequest] = useState(null); // REMOVED modal state
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
            // setSelectedRequest(null); // Close modal if open
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
                            onClick={() => navigate(`/hod/od-requests/${approval.id}`)}
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

        </HodLayout>
    );
};

export default OdApprovals;
