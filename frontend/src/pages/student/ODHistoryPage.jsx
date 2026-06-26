import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { api } from '../../services/api';
import { Calendar, CheckCircle, Clock, XCircle, FileText, Download } from 'lucide-react';
import { generateODLetter } from '../../utils/odGenerator';

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
            case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
        }
    };

    return (
        <>
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My OD History</h1>
                    <p className="text-gray-500 dark:text-gray-400">Track status and view approved ON DUTY requests.</p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
                ) : ods.length === 0 ? (
                    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No OD Requests Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Apply for OD through the Competitions tab.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ods.map((od) => (
                            <div key={od.id} className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="w-full">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white break-words">{od.competitions?.title || 'Unknown Event'}</h3>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(od.status)}`}>
                                                {od.status}
                                            </span>
                                            {od.is_extension && (
                                                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                                    Extended OD {od.extension_count > 0 && `(${od.extension_count}x)`}
                                                </span>
                                            )}
                                        </div>

                                        {/* Show multiple competitions if extended */}
                                        {od.competitions_info && od.competitions_info.length > 0 && (
                                            <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                                                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase mb-2">
                                                    Combined Competitions:
                                                </p>
                                                <div className="space-y-1">
                                                    {od.competitions_info.map((comp, idx) => (
                                                        <div key={idx} className="text-sm text-purple-800 dark:text-purple-200">
                                                            <span className="font-medium">{comp.title}</span>
                                                            <span className="text-purple-600 dark:text-purple-400 ml-2">
                                                                ({new Date(comp.from_date).toLocaleDateString()} - {new Date(comp.to_date).toLocaleDateString()})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-gray-600 dark:text-gray-300 mb-4">{od.reason}</p>

                                        <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} />
                                                <span>
                                                    {new Date(od.from_date).toLocaleDateString()} - {new Date(od.to_date).toLocaleDateString()}
                                                    {od.original_from_date && od.original_from_date !== od.from_date && (
                                                        <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">
                                                            (Originally: {new Date(od.original_from_date).toLocaleDateString()})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} />
                                                <span>Requested: {new Date(od.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Display Team Members if Approved */}
                                        {od.status === 'APPROVED' && od.teams?.members_info && od.teams.members_info.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Team Members Included:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {od.teams.members_info.map((m, i) => (
                                                        <span key={i} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700">
                                                            {m.name} ({m.reg_no})
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        {od.status === 'APPROVED' && (
                                            <button
                                                onClick={() => {
                                                    const userData = JSON.parse(localStorage.getItem('auth_user'));
                                                    generateODLetter(od, userData);
                                                }}
                                                className="flex justify-center items-center gap-2 px-4 py-2 w-full sm:w-auto bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                            >
                                                <Download size={16} /> Download Letter
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
        </>
    );
};

export default ODHistoryPage;
