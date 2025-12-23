import React from 'react';
import HodSidebar from './Sidebar';
import { ShieldCheck } from 'lucide-react';

const OdApprovals = () => {
    // Empty pending list as "fake details" are not allowed
    const pendingApprovals = [];

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
                    {pendingApprovals.length > 0 ? (
                        pendingApprovals.map(approval => (
                            <div key={approval.id}>
                                {/* Card content would go here */}
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
