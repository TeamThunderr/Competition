import React, { useEffect, useState } from 'react';

import { CheckCircle, XCircle, Users, FileText, X, ZoomIn } from 'lucide-react';
import { 
    getPendingVerifications, verifyRegistration, 
    getPendingShortlistVerifications, verifyShortlist,
    getPendingWinningVerifications, verifyWinning
} from '../../services/facultyService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatDate } from '../../utils/dateFormatter';

const FacultyVerify = () => {
    const [activeTab, setActiveTab] = useState('registration'); // 'registration' | 'shortlist' | 'winning'
    const [registrations, setRegistrations] = useState([]);
    const [shortlisted, setShortlisted] = useState([]);
    const [winning, setWinning] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null); // State for image lightbox

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
            // Fetch all lists in parallel
            const [regData, shortlistData, winningData] = await Promise.all([
                getPendingVerifications(),
                getPendingShortlistVerifications(),
                getPendingWinningVerifications()
            ]);

            // Handle Registration Data
            setRegistrations(Array.isArray(regData) ? regData : regData?.registrations || []);

            // Handle Shortlist Data
            setShortlisted(Array.isArray(shortlistData) ? shortlistData : []);

            // Handle Winning Data
            setWinning(Array.isArray(winningData) ? winningData : []);

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
                setRegistrations(prev => prev.filter(p => p.id !== id));
            } else if (activeTab === 'shortlist') {
                await verifyShortlist(id, action);
                setShortlisted(prev => prev.filter(p => p.id !== id));
            } else if (activeTab === 'winning') {
                await verifyWinning(id, action);
                setWinning(prev => prev.filter(p => p.id !== id));
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

    const currentList = activeTab === 'registration'
        ? registrations
        : activeTab === 'shortlist'
            ? shortlisted
            : winning;

    return (
        <>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Pending Actions</h1>
                    <p className="text-muted mt-2">Verify manual registration proofs uploaded by students.</p>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto whitespace-nowrap gap-2 sm:gap-4 border-b border-border mb-6 pb-1" style={{ scrollbarWidth: 'none' }}>
                    <button
                        onClick={() => setActiveTab('registration')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'registration'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Registration <span className="hidden sm:inline">Proofs</span>
                        {registrations.length > 0 && (
                            <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full dark:bg-primary/20">
                                {registrations.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('shortlist')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'shortlist'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Shortlisted <span className="hidden sm:inline">Proofs</span>
                        {shortlisted.length > 0 && (
                            <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full dark:bg-primary/20">
                                {shortlisted.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('winning')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'winning'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Winning <span className="hidden sm:inline">Proofs</span>
                        {winning.length > 0 && (
                            <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full dark:bg-primary/20">
                                {winning.length}
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
                            No pending {activeTab === 'registration' ? 'registration' : activeTab === 'shortlist' ? 'shortlist' : 'winning'} verification requests.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {currentList.map((item) => {
                            const proofUrl = item.winning_proof_url || item.shortlist_proof_url || item.proof_url || item.proofUrl;
                            return (
                                <div key={item.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row">
                                    {/* Proof Image Preview (Click to open modal) */}
                                    <div className="w-full md:w-56 h-36 md:h-auto bg-muted/10 md:border-r border-border relative group cursor-pointer"
                                         onClick={() => setSelectedImage(proofUrl)}>
                                        <img
                                            src={proofUrl}
                                            alt="Proof"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                                <ZoomIn size={16} />
                                                View Proof
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 p-4 md:p-6 flex flex-col justify-center">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-base md:text-lg font-bold text-foreground line-clamp-1 pr-2">
                                                {item.competitions?.title || item.competitionTitle || item.competition || 'Unknown Competition'}
                                            </h3>
                                            <span className={`px-2 py-1 text-[10px] md:text-xs rounded-full font-bold uppercase tracking-wider ${activeTab === 'registration'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : activeTab === 'shortlist'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                }`}>
                                                {activeTab === 'registration' ? 'Registration' : activeTab === 'shortlist' ? 'Shortlist' : 'Winning'}
                                            </span>
                                        </div>

                                        <div className="mt-2 md:mt-4 grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                                            <div>
                                                <span className="text-muted block text-[10px] md:text-xs uppercase font-semibold mb-0.5">Student Name</span>
                                                <span className="font-medium text-foreground truncate block">{item.users?.full_name || item.studentName || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted block text-[10px] md:text-xs uppercase font-semibold mb-0.5">Registration No</span>
                                                <span className="font-medium text-foreground">{item.users?.registration_no || item.regNo || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted block text-[10px] md:text-xs uppercase font-semibold mb-0.5">Section</span>
                                                <span className="font-medium text-foreground">{item.users?.section || item.section || 'N/A'}</span>
                                            </div>

                                            <div>
                                                <span className="text-muted block text-[10px] md:text-xs uppercase font-semibold mb-0.5">Submitted At</span>
                                                <span className="font-medium text-foreground">
                                                    {formatDate(item.created_at || item.submittedAt || item.registered_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="p-3 md:p-6 grid grid-cols-2 md:flex md:flex-col justify-center gap-2 md:gap-3 border-t md:border-t-0 md:border-l border-border bg-gray-50/50 dark:bg-gray-800/30">
                                        <button
                                            onClick={() => handleAction(item.id, 'approve')}
                                            disabled={!!actionLoading}
                                            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 md:px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm text-sm"
                                        >
                                            {actionLoading === item.id ? (
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <CheckCircle size={16} />
                                            )}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(item.id, 'reject')}
                                            disabled={!!actionLoading}
                                            className="flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 px-4 md:px-6 py-2 rounded-lg font-medium hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-red-900/50 dark:hover:bg-red-900/20 text-sm"
                                        >
                                            <XCircle size={16} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            
            {/* Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        <button 
                            className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white p-2 transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={32} />
                        </button>
                        <img 
                            src={selectedImage} 
                            alt="Full Proof" 
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            )}

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
        </>
    );
};

export default FacultyVerify;
