import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { CheckCircle, XCircle, ExternalLink, Users, FileText } from 'lucide-react';
import { getPendingVerifications, verifyRegistration, getPendingShortlistVerifications, verifyShortlist } from '../../services/facultyService';
import { api } from '../../services/api'; // Direct API for team verification if service not unified
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import ConfirmModal from '../../components/common/ConfirmModal';

const FacultyVerify = () => {
    const [activeTab, setActiveTab] = useState('registration'); // 'registration' | 'shortlist'
    const [registrations, setRegistrations] = useState([]);
    const [shortlisted, setShortlisted] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        action: null,
        id: null,
        title: '',
        message: '',
        type: 'info'
    });

    const fetchPending = async () => {
        setLoading(true);
        try {
            // Fetch both lists in parallel
            const [regData, shortlistData] = await Promise.all([
                getPendingVerifications(),
                getPendingShortlistVerifications()
            ]);

            // Handle Registration Data (Legacy check not needed as we control API, but safe to keep array check)
            if (Array.isArray(regData)) {
                setRegistrations(regData);
            } else {
                setRegistrations(regData?.registrations || []);
            }

            // Handle Shortlist Data
            if (Array.isArray(shortlistData)) {
                setShortlisted(shortlistData);
            } else {
                setShortlisted([]);
            }

        } catch (err) {
            console.error("Error fetching pending verifications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = (id, status) => {
        const isApprove = status === 'approve';
        setConfirmModal({
            isOpen: true,
            action: status,
            id: id,
            title: isApprove ? 'Approve Request' : 'Reject Request',
            message: isApprove
                ? 'Are you sure you want to approve this verification request? This will verify the student.'
                : 'Are you sure you want to reject this request? This action cannot be undone.',
            type: isApprove ? 'success' : 'danger'
        });
    };

    const executeAction = async () => {
        const { id, action } = confirmModal;
        if (!id || !action) return;

        setActionLoading(id);
        setConfirmModal(prev => ({ ...prev, loading: true })); // Add loading state to modal if supported or just use local

        try {
            if (activeTab === 'registration') {
                await verifyRegistration(id, action);
            } else {
                await verifyShortlist(id, action);
            }

            if (activeTab === 'registration') {
                setRegistrations(prev => prev.filter(p => p.id !== id));
            } else {
                setShortlisted(prev => prev.filter(p => p.id !== id));
            }

            // Close modal on success
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
            console.error(err);
            // Could show a toast here, or just keep modal open with error? 
            // For now, simple console log, maybe close logic.
            // alert("Failed to process request."); // Removed alert as requested
        } finally {
            setActionLoading(false);
            setConfirmModal(prev => ({ ...prev, loading: false }));
        }
    };

    const currentList = activeTab === 'registration' ? registrations : shortlisted;

    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <Sidebar />

            <main className="flex-1 md:ml-sidebar p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Pending Actions</h1>
                    <p className="text-muted mt-2">Verify manual registration proofs uploaded by students.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-border mb-6">
                    <button
                        onClick={() => setActiveTab('registration')}
                        className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'registration'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Registration Proofs
                        {registrations.length > 0 && (
                            <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full dark:bg-primary/20">
                                {registrations.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('shortlist')}
                        className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'shortlist'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Shortlisted Proofs
                        {shortlisted.length > 0 && (
                            <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full dark:bg-primary/20">
                                {shortlisted.length}
                            </span>
                        )}
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <RoleBasedLoader role="FACULTY" />
                    </div>
                ) : currentList.length === 0 ? (
                    <div className="bg-card rounded-xl border border-border p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">All Caught Up!</h3>
                        <p className="text-muted mt-2">
                            No pending {activeTab === 'registration' ? 'registration' : 'shortlist'} verification requests.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {currentList.map((item) => (
                            <div key={item.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row">
                                {/* Proof Image Preview (Click to open full) */}
                                <div className="w-full md:w-64 h-48 md:h-auto bg-muted/10 md:border-r border-border relative group">
                                    <img
                                        src={item.proofUrl || item.proof_url || item.shortlist_proof_url} // Handle various backend naming conventions
                                        alt="Proof"
                                        className="w-full h-full object-cover"
                                    />
                                    <a
                                        href={item.proofUrl || item.proof_url || item.shortlist_proof_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <div className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                            <ExternalLink size={16} />
                                            View Full
                                        </div>
                                    </a>
                                </div>

                                {/* Details */}
                                <div className="flex-1 p-6 flex flex-col justify-center">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-foreground">
                                            {item.competitions?.title || item.competitionTitle || item.competition || 'Unknown Competition'}
                                        </h3>
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${activeTab === 'registration'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                            }`}>
                                            {activeTab === 'registration' ? 'Registration' : 'Shortlist'}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted block">Student Name</span>
                                            <span className="font-medium text-foreground">{item.users?.full_name || item.studentName || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted block">Registration No</span>
                                            <span className="font-medium text-foreground">{item.users?.registration_no || item.regNo || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted block">Class/Section</span>
                                            <span className="font-medium text-foreground">Section {item.users?.section || item.section || 'N/A'}</span>
                                        </div>

                                        <div>
                                            <span className="text-muted block">Submitted At</span>
                                            <span className="font-medium text-foreground">
                                                {item.registered_at
                                                    ? new Date(item.registered_at).toLocaleDateString()
                                                    : (item.submittedAt || 'N/A')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 flex gap-3">
                                        <button
                                            onClick={() => handleAction(item.id, 'approve')}
                                            disabled={actionLoading === item.id}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            {actionLoading === item.id ? (
                                                <span className="animate-pulse">Processing...</span>
                                            ) : (
                                                <>
                                                    <CheckCircle size={18} />
                                                    Accept
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleAction(item.id, 'reject')}
                                            disabled={actionLoading === item.id}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={18} />
                                            Reject
                                        </button>
                                    </div>
                                </div>


                            </div>
                        ))}
                    </div>
                )}
            </main>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeAction}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                loading={confirmModal.loading}
                confirmText={confirmModal.type === 'danger' ? 'Reject' : 'Approve'}
                cancelText="Cancel"
            />

        </div>
    );
};

export default FacultyVerify;
