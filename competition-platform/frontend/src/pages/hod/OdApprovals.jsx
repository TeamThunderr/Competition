import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HodLayout from './HodLayout';
import { ShieldCheck, Check, X, Calendar, ChevronRight, ExternalLink } from 'lucide-react';
import { getPendingODRequests, manageODRequest } from '../../services/hodService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import ConfirmModal from '../../components/common/ConfirmModal';

const OdApprovals = () => {
    const navigate = useNavigate();
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    });
    const [pendingAction, setPendingAction] = useState(null); // { type: 'BULK'|'SINGLE', status: '...', id?: ... }

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Open Modal for Bulk Actions
    const initBulkAction = (status) => {
        setPendingAction({ type: 'BULK', status });
        setConfirmModal({
            isOpen: true,
            title: status === 'APPROVED' ? 'Approve Selected' : 'Reject Selected',
            message: `Are you sure you want to ${status} ${selectedIds.length} requests?`,
            type: status === 'APPROVED' ? 'success' : 'danger',
            confirmText: 'Confirm',
            cancelText: 'Cancel'
        });
    };

    // Open Modal for Single Action
    const initSingleAction = (id, status) => {
        setPendingAction({ type: 'SINGLE', status, id });
        setConfirmModal({
            isOpen: true,
            title: status === 'APPROVED' ? 'Approve Request' : 'Reject Request',
            message: `Are you sure you want to ${status} this request?`,
            type: status === 'APPROVED' ? 'success' : 'danger',
            confirmText: status === 'APPROVED' ? 'Approve' : 'Reject',
            cancelText: 'Cancel'
        });
    };

    // Execute Confirmed Action
    const handleConfirm = async () => {
        if (!pendingAction) return;

        try {
            if (pendingAction.type === 'BULK') {
                // Execute in parallel
                await Promise.all(selectedIds.map(id => manageODRequest(id, pendingAction.status)));
                setPendingApprovals(prev => prev.filter(od => !selectedIds.includes(od.id)));
                setSelectedIds([]);
            } else if (pendingAction.type === 'SINGLE') {
                await manageODRequest(pendingAction.id, pendingAction.status);
                setPendingApprovals(prev => prev.filter(od => od.id !== pendingAction.id));
            }

            setConfirmModal({
                isOpen: true,
                title: 'Success',
                message: 'Action completed successfully!',
                type: 'success',
                confirmText: 'OK',
                showCancel: false,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
                onClose: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });

        } catch (error) {
            console.error(`Action failed`, error);
            setConfirmModal(prev => ({
                ...prev,
                title: 'Error',
                message: 'Failed to complete action. Please try again.',
                type: 'danger',
                onConfirm: () => setConfirmModal(p => ({ ...p, isOpen: false }))
            }));
        } finally {
            setPendingAction(null);
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
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300"></span>
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
                                onClick={() => initBulkAction('REJECTED')}
                                className="px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                REJECT ALL
                            </button>
                            <button
                                onClick={() => initBulkAction('APPROVED')}
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
                                    {approval.is_extension && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                            🔗 Extended OD {approval.extension_count > 0 && `(${approval.extension_count}x)`}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted mt-3">
                                    <div className="flex items-center space-x-2">
                                        <ShieldCheck size={16} className="text-muted flex-shrink-0" />
                                        <span className="truncate font-medium text-foreground">{approval.competitions?.title || 'External Event'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Calendar size={16} className="text-muted flex-shrink-0" />
                                        <span>{approval.competitions?.event_date ? new Date(approval.competitions.event_date).toLocaleDateString() : 'Date N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 border-l border-gray-100 pl-4 w-32">
                                <button
                                    onClick={(e) => { e.stopPropagation(); initSingleAction(approval.id, 'APPROVED'); }}
                                    className="w-full py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <Check size={14} />
                                    Approve
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); initSingleAction(approval.id, 'REJECTED'); }}
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

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={confirmModal.onClose || (() => setConfirmModal(prev => ({ ...prev, isOpen: false })))}
                onConfirm={confirmModal.onConfirm || handleConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText || "Confirm"}
                cancelText={confirmModal.cancelText}
                showCancel={confirmModal.showCancel !== false}
                loading={loading}
            />

        </HodLayout>
    );
};

export default OdApprovals;
