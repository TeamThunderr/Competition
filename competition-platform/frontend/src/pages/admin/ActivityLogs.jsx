import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // Fetch all competitions to act as "logs" since we track creations
                const data = await api.get('/api/competitions');
                if (Array.isArray(data)) {
                    // Sort by created_at desc (newest first)
                    const sorted = data.sort((a, b) => {
                        const dateA = new Date(a.created_at || 0);
                        const dateB = new Date(b.created_at || 0);
                        return dateB - dateA;
                    });

                    const activityLogs = sorted.map(comp => ({
                        id: comp.id,
                        title: comp.title, // Added title explicitly
                        action: "Competition Uploaded",
                        details: `Created competition: ${comp.title}`,
                        user: "Admin", // Assuming admin for now as per context
                        timestamp: comp.created_at || new Date().toISOString(),
                        status: "Success"
                    }));

                    setLogs(activityLogs);
                }
            } catch (err) {
                console.error("Failed to fetch activity logs", err);
                setError("Failed to load activity logs.");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8 relative">
                    <Link to="/admin" className="absolute left-0 top-0 inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Dashboard
                    </Link>
                    <div className="text-center pt-8">
                        <h1 className="text-2xl font-bold text-gray-900">System Activity Logs</h1>
                        <p className="text-gray-500 mt-1">Full history of system actions and uploads.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div className="font-semibold text-gray-700">Total Activities: {logs.length}</div>
                        {/* Placeholder for future filtering if needed */}
                    </div>

                    import RoleBasedLoader from '../../components/common/RoleBasedLoader';
                    // ... imports

                    // ... code

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <RoleBasedLoader role="ADMIN" />
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center text-red-500 flex flex-col items-center gap-2">
                            <AlertCircle size={24} />
                            {error}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No activity logs found.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {logs.map((log) => (
                                <Link
                                    to={`/competitions/${log.id}`}
                                    key={log.id}
                                    className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group block"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {log.title}
                                                </h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {log.status === 'Success' ? 'Upload Success' : 'Failed'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <span>By:</span>
                                                    <span className="font-medium text-gray-700">{log.user}</span>
                                                </div>
                                                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                                <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                                                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                                <div>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-sm font-medium mr-2">View Details</span>
                                        &rarr;
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogs;
