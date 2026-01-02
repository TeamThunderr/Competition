import React, { useState, useEffect } from 'react';
import HodSidebar from './Sidebar';
import { ShieldCheck, Check, X, Clock, Calendar } from 'lucide-react'; // Added icons
import { getPendingODRequests, manageODRequest } from '../../services/usersService';
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

    const handleAction = async (id, status) => {
        try {
            await manageODRequest(id, status);
            setPendingApprovals(prev => prev.filter(od => od.id !== id));
            setSelectedRequest(null); // Close modal if open
        } catch (error) {
            console.error(`Failed to ${status} OD request`, error);
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <HodSidebar />

            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">OD Approval Queue</h1>
                        <p className="text-gray-500 mt-1">Verify official email evidence and grant On-Duty permissions.</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg flex items-center space-x-2">
                        <ShieldCheck size={18} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Automated DKIM Verification Active</span>
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
                                className="bg-white rounded-xl border border-gray-100 p-6 flex justify-between items-center shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
                            >
                                <div>
                                    <div className="flex items-center space-x-3 mb-1">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{approval.users?.full_name || 'Unknown Student'}</h3>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full border border-gray-200">
                                            {approval.users?.registration_no}
                                        </span>
                                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                                            Sec {approval.users?.section}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center space-x-4">
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
                                    <span className="text-xs text-gray-400 font-medium mr-2 group-hover:text-blue-500">View Details &rarr;</span>
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
                                        <span>Approve</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No Pending Approvals</h3>
                            <p className="text-gray-500 mt-2">All OD requests have been processed.</p>
                        </div>
                    )}
                </div>

                {/* Details Modal */}
                {selectedRequest && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedRequest(null)}>
                        <div
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Request Details</h2>
                                    <p className="text-sm text-gray-500">Review request before approval</p>
                                </div>
                                <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full border border-gray-200 shadow-sm transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Student Info Block */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                        {selectedRequest.users?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">{selectedRequest.users?.full_name}</h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                            <span>{selectedRequest.users?.registration_no}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span className="text-blue-600 font-medium">Sec {selectedRequest.users?.section}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Event Info & Approval Settings */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</span>
                                            <p className="font-medium text-gray-900 mt-0.5">{selectedRequest.competitions?.title}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</span>
                                            <p className="font-medium text-gray-900 mt-0.5">
                                                {selectedRequest.competitions?.event_date
                                                    ? new Date(selectedRequest.competitions.event_date).toLocaleDateString()
                                                    : <span className="text-orange-600">TBA</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {/* HOD Overrides / Settings */}
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200/50">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Time Slot</label>
                                            <select
                                                id="od-time-slot"
                                                className="w-full text-sm p-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Duration (Days)</label>
                                                <input
                                                    id="od-duration"
                                                    type="number"
                                                    min="1"
                                                    defaultValue="10"
                                                    className="w-full text-sm p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reason Block */}
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Detailed Reason</span>
                                    <div className="bg-blue-50/50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed border border-blue-100">
                                        {selectedRequest.reason || "No specific reason provided."}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => handleAction(selectedRequest.id, 'REJECTED')}
                                    className="flex-1 py-2.5 text-sm font-medium text-red-600 bg-white hover:bg-red-50 rounded-lg transition-colors border border-gray-200 shadow-sm"
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
            </div>
        </div>
    );
};

export default OdApprovals;
