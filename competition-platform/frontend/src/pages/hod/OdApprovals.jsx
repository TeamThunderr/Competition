import React, { useState, useEffect } from 'react';
import HodSidebar from './Sidebar';
import { ShieldCheck, Check, X, Clock, Calendar, Menu } from 'lucide-react'; // Added icons
import { getPendingODRequests, manageODRequest } from '../../services/usersService';
import logo from '../../assets/logo.png';

const OdApprovals = () => {
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            // Remove from list locally for instant UI update
            setPendingApprovals(prev => prev.filter(od => od.id !== id));
            // Optional: Show success toast
        } catch (error) {
            console.error(`Failed to ${status} OD request`, error);
            // Optional: Show error toast
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <HodSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
                {/* Mobile Header with Menu Button */}
                <div className="md:hidden flex items-center justify-between mb-6">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <img src={logo} alt="Logo" className="h-8 object-contain mix-blend-multiply" />
                    <div className="w-10"></div>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between items-start mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">OD Approval Queue</h1>
                        <p className="text-gray-500 mt-1">Verify official email evidence and grant On-Duty permissions.</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg flex items-center space-x-2 w-full md:w-auto justify-center">
                        <ShieldCheck size={18} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Automated DKIM Verification Active</span>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading requests...</div>
                    ) : pendingApprovals.length > 0 ? (
                        pendingApprovals.map(approval => (
                            <div key={approval.id} className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm gap-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900">{approval.users?.full_name || 'Unknown Student'}</h3>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full border border-gray-200">
                                            {approval.users?.registration_no}
                                        </span>
                                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                                            Sec {approval.users?.section}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <span className="flex items-center space-x-1">
                                            <ShieldCheck size={14} />
                                            <span>{approval.competitions?.title || 'External Event'}</span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                            <Calendar size={14} />
                                            <span>{approval.competitions?.event_date ? new Date(approval.competitions.event_date).toLocaleDateString() : 'Date N/A'}</span>
                                        </span>
                                        {/* Assuming requested_dates is stored or just using event date for now */}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                                    <button
                                        onClick={() => handleAction(approval.id, 'REJECTED')}
                                        className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 text-center"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleAction(approval.id, 'APPROVED')}
                                        className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm"
                                    >
                                        <Check size={16} />
                                        <span>Approve OD</span>
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
            </div>
        </div>
    );
};

export default OdApprovals;
