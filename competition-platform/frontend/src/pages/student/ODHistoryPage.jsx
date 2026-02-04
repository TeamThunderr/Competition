import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { api } from '../../services/api';
import { Calendar, CheckCircle, Clock, XCircle, FileText, Download } from 'lucide-react';

const ODHistoryPage = () => {
    const [ods, setOds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchODs = async () => {
            setLoading(true);
            try {
                // Use Backend API (Service Key) to bypass RLS issues
                const data = await api.get('/api/student/od-requests');
                setOds(data || []);
            } catch (err) {
                console.error("Fetch OD Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchODs();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 md:ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My OD History</h1>
                    <p className="text-gray-500">Track status and view approved ON DUTY requests.</p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading...</div>
                ) : ods.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No OD Requests Yet</h3>
                        <p className="text-gray-500 mt-2">Apply for OD through the Competitions tab.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ods.map((od) => (
                            <div key={od.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{od.competitions?.title || 'Unknown Event'}</h3>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(od.status)}`}>
                                                {od.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-4">{od.reason}</p>

                                        <div className="flex gap-6 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} />
                                                <span>
                                                    {new Date(od.from_date).toLocaleDateString()} - {new Date(od.to_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} />
                                                <span>Requested: {new Date(od.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Display Team Members if Approved */}
                                        {od.status === 'APPROVED' && od.teams?.members_info && od.teams.members_info.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-50">
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Team Members Included:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {od.teams.members_info.map((m, i) => (
                                                        <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200">
                                                            {m.name} ({m.reg_no})
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2">
                                        {od.status === 'APPROVED' && (
                                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition">
                                                <Download size={16} /> Download Letter
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ODHistoryPage;
