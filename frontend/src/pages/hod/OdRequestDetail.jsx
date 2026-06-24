import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HodLayout from './HodLayout';
import { ArrowLeft, Check, X, ShieldCheck, Calendar, Clock, User, ExternalLink } from 'lucide-react';
import { getODRequestDetail, manageODRequest } from '../../services/hodService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import ConfirmModal from '../../components/common/ConfirmModal';

const OdRequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Form inputs for approval
    const [timeSlot, setTimeSlot] = useState('Full Day');
    const [duration, setDuration] = useState(1);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    });
    const [pendingAction, setPendingAction] = useState(null); // Store action to execute after confirm

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await getODRequestDetail(id);
                setRequest(data);

                // Set default duration if not set
                if (data && !data.competitions?.event_date) {
                    setDuration(10);
                }
            } catch (err) {
                console.error("Failed to fetch OD detail", err);
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: "Failed to load request details.",
                    type: 'danger',
                    onConfirm: () => navigate('/hod/approvals')
                });
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetail();
    }, [id, navigate]);

    // Open Modal
    const openConfirmModal = (status) => {
        setPendingAction(status);
        setConfirmModal({
            isOpen: true,
            title: status === 'APPROVED' ? 'Approve Request' : 'Reject Request',
            message: `Are you sure you want to ${status} this request?`,
            type: status === 'APPROVED' ? 'success' : 'danger',
            confirmText: status === 'APPROVED' ? 'Approve' : 'Reject',
            cancelText: 'Cancel'
        });
    };

    // Execute Action
    const handleConfirmAction = async () => {
        if (!pendingAction) return;

        setActionLoading(true);
        try {
            await manageODRequest(id, pendingAction, { timeSlot, duration });
            setConfirmModal({
                isOpen: true,
                title: 'Success',
                message: `Request ${pendingAction} successfully!`,
                type: 'success',
                showCancel: false,
                confirmText: 'OK',
                onConfirm: () => navigate('/hod/approvals'),
                onClose: () => navigate('/hod/approvals') // Just in case
            });
            setPendingAction(null); // Clear action
        } catch (error) {
            console.error(`Failed to ${pendingAction}`, error);
            setConfirmModal(prev => ({
                ...prev,
                title: 'Error',
                message: `Failed to ${pendingAction} request.`,
                type: 'danger',
                onConfirm: () => setConfirmModal(p => ({ ...p, isOpen: false })), // Just close
                loading: false
            }));
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <RoleBasedLoader role="HOD" />
            </div>
        );
    }

    if (!request) return null;

    return (
        <>
            <div className="max-w-4xl mx-auto">
                {/* Header with Back Button */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/hod/approvals')}
                        className="flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Queue
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">OD Request Details</h1>
                            <p className="text-gray-500 mt-2">Review specific details provided by the student.</p>
                        </div>
                        <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-bold border border-purple-100 text-sm">
                            Status: {request.status}
                        </div>
                    </div>
                </div>

                {/* Extension Alert */}
                {request.is_extension && (
                    <div className="mb-6 bg-purple-50 border border-purple-200 p-6 rounded-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <Clock className="text-purple-600" size={24} />
                            <div>
                                <h3 className="font-bold text-purple-900 text-lg">🔗 Extended OD Request</h3>
                                <p className="text-sm text-purple-700">
                                    This OD has been extended <strong>{request.extension_count || 1}</strong> time(s) from the original request.
                                </p>
                            </div>
                        </div>

                        {/* Extension Timeline */}
                        <div className="bg-white p-4 rounded border border-purple-200 mb-3">
                            <h4 className="text-sm font-bold text-purple-900 uppercase mb-2">Extension Timeline</h4>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-gray-700">Original Start:</span>
                                <span className="text-purple-700 font-bold">
                                    {request.original_from_date ? new Date(request.original_from_date).toLocaleDateString() : new Date(request.from_date).toLocaleDateString()}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="font-medium text-gray-700">Extended End:</span>
                                <span className="text-purple-700 font-bold">
                                    {new Date(request.to_date).toLocaleDateString()}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                    ({Math.ceil((new Date(request.to_date) - new Date(request.original_from_date || request.from_date)) / (1000 * 60 * 60 * 24)) + 1} days total)
                                </span>
                            </div>
                        </div>

                        {/* Multiple Competitions */}
                        {request.competitions_info && request.competitions_info.length > 0 && (
                            <div className="bg-white p-4 rounded border border-purple-200">
                                <h4 className="text-sm font-bold text-purple-900 uppercase mb-2">Combined Competitions</h4>
                                <div className="space-y-2">
                                    {request.competitions_info.map((comp, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                                            <span className="font-medium text-purple-900">{comp.title}</span>
                                            <span className="text-sm text-purple-700">
                                                {new Date(comp.from_date).toLocaleDateString()} - {new Date(comp.to_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content: Student & Event Info */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Student Card */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-6">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl">
                                {request.users?.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{request.users?.full_name}</h2>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 text-sm text-gray-600">
                                    <div>
                                        <span className="block text-xs uppercase text-gray-400 font-semibold">Reg No</span>
                                        {request.users?.registration_no}
                                    </div>
                                    <div>
                                        <span className="block text-xs uppercase text-gray-400 font-semibold">Section</span>
                                        {request.users?.section}
                                    </div>
                                    <div className="col-span-2 mt-2">
                                        <span className="block text-xs uppercase text-gray-400 font-semibold">Department</span>
                                        Computer Science (Auto-detected)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Event Details */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ShieldCheck className="text-blue-600" size={20} />
                                Competition / Event
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <span className="block text-sm text-gray-500 mb-1">Event Title</span>
                                    <p className="text-lg font-medium text-gray-900">{request.competitions?.title || 'External Event'}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                                            <Calendar size={16} />
                                            <span className="text-sm font-medium">Event Date</span>
                                        </div>
                                        <p className="font-bold text-gray-900">
                                            {request.competitions?.event_date
                                                ? new Date(request.competitions.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                                : <span className="text-orange-500">To Be Announced</span>}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                                            <Clock size={16} />
                                            <span className="text-sm font-medium">Requested Duration</span>
                                        </div>
                                        <p className="font-bold text-gray-900">
                                            {request.from_date} to {request.to_date}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reason / Letter */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Statement of Purpose / Reason</h3>
                            <div className="bg-gray-50 p-6 rounded-lg text-gray-700 leading-relaxed border border-gray-200">
                                {request.reason || "No specific reason provided."}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar: Proofs & Actions */}
                    <div className="space-y-6">

                        {/* Team Info */}
                        {request.teams && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Team Details</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <span className="text-gray-500 text-sm">Team Name</span>
                                        <span className="font-medium text-right">{request.teams.team_name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <span className="text-gray-500 text-sm">Status</span>
                                        <span className={`font-bold text-sm ${request.teams.verification_status === 'VERIFIED' ? 'text-green-600' :
                                            request.teams.verification_status === 'REJECTED' ? 'text-red-600' :
                                                'text-orange-600'
                                            }`}>
                                            {request.teams.verification_status}
                                        </span>
                                    </div>

                                    {/* Proof Preview */}
                                    <div className="mt-4">
                                        <span className="block text-gray-500 text-sm mb-2">Proof Document</span>
                                        {request.teams.proof_url ? (
                                            <a
                                                href={request.teams.proof_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-center py-3 rounded-lg border border-blue-200 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink size={16} /> View Proof
                                            </a>
                                        ) : (
                                            <div className="text-center text-gray-400 text-sm py-2 italic">No proof attached</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Team Members List */}
                        {request.teams && request.teams.members_info && request.teams.members_info.length > 0 && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Team Members</h3>
                                <div className="space-y-3">
                                    {request.teams.members_info.map((member, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                                                <p className="text-xs text-gray-500">{member.reg_no}</p>
                                            </div>
                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                                {idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Approval Actions */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg sticky top-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Action</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Approve For</label>
                                    <select
                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={timeSlot}
                                        onChange={(e) => setTimeSlot(e.target.value)}
                                    >
                                        <option value="Full Day">Full Day</option>
                                        <option value="First Half">First Half (Morning)</option>
                                        <option value="Second Half">Second Half (Afternoon)</option>
                                        <option value="After Break">After Break (10:30 AM+)</option>
                                        <option value="After Lunch">After Lunch (1:30 PM+)</option>
                                    </select>
                                </div>

                                {!request.competitions?.event_date && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Duration (Days)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        onClick={() => openConfirmModal('REJECTED')}
                                        disabled={actionLoading}
                                        className="w-full py-3 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg font-bold text-sm transition-colors"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => openConfirmModal('APPROVED')}
                                        disabled={actionLoading}
                                        className="w-full py-3 text-white bg-green-600 hover:bg-green-700 rounded-lg font-bold text-sm shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? 'Processing...' : (
                                            <>
                                                <Check size={18} /> Approve
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={confirmModal.onClose || (() => setConfirmModal(prev => ({ ...prev, isOpen: false })))}
                onConfirm={confirmModal.onConfirm || handleConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                loading={actionLoading}
            />
        </>
    );
};

export default OdRequestDetail;
