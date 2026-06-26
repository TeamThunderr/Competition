import React, { useState, useEffect } from 'react';

import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { getPendingVerifications, verifyRegistration } from '../../services/facultyService';

const ManualVerification = () => {
    // Mock Data for Pending Requests
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const response = await getPendingVerifications();
            if (response && response.data) {
                setRequests(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch verifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const [selectedImage, setSelectedImage] = useState(null);

    const handleAction = async (id, action) => {
        try {
            await verifyRegistration(id, action);
            // Assuming simplified success if no error thrown
            setRequests(prev => prev.filter(req => req.id !== id));
            alert(`Request ${action === 'approve' ? 'Approved' : 'Rejected'}`);
        } catch (error) {
            console.error("Verification Action Error:", error);
            alert("Error processing request.");
        }
    };

    return (
        <>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Manual Verification</h1>
                    <p className="text-gray-500 mt-1">Review proof of participation uploaded by students.</p>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {requests.length > 0 ? (
                        requests.map(req => (
                            <div key={req.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{req.studentName}</h3>
                                        <p className="text-sm text-gray-500">{req.regNo}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full border border-yellow-100">
                                        {req.status}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-700">
                                    <span className="font-semibold">Competition:</span> {req.competition}
                                </div>

                                {/* Image Preview */}
                                <div className="relative group cursor-pointer border rounded-lg overflow-hidden h-48 bg-gray-100 flex items-center justify-center" onClick={() => setSelectedImage(req.proofUrl)}>
                                    <img src={req.proofUrl} alt="Proof" className="object-cover w-full h-full" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-medium">
                                        <Eye size={20} /> View Full Image
                                    </div>
                                </div>

                                <div className="text-xs text-gray-400">
                                    Submitted on: {req.submittedAt}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mt-2">
                                    <button
                                        onClick={() => handleAction(req.id, 'reject')}
                                        className="flex-1 py-2 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={18} /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleAction(req.id, 'approve')}
                                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Verify
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white p-12 rounded-xl border border-gray-100 text-center">
                            <div className="text-4xl mb-4">✅</div>
                            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                            <p className="text-gray-500 mt-1">No pending verification requests found.</p>
                        </div>
                    )}
                </div>

                {/* Lightbox for Image */}
                {selectedImage && (
                    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8" onClick={() => setSelectedImage(null)}>
                        <img src={selectedImage} alt="Proof Full" className="max-w-full max-h-full rounded-lg shadow-2xl" />
                        <button className="absolute top-6 right-6 text-white hover:text-gray-300">
                            <XCircle size={32} />
                        </button>
                    </div>
                )}
        </>
    );
};

export default ManualVerification;
