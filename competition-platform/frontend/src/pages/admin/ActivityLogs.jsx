import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { ArrowLeft, Clock, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import EditCompetitionModal from '../../components/admin/EditCompetitionModal';
import { useToast } from '../../contexts/ToastContext';

const ActivityLogs = () => {
    const { addToast } = useToast();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit/Delete State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState(null);

    const fetchLogs = async () => {
        try {
            // Fetch all competitions to act as "logs" since we track creations
            const response = await api.get('/api/competitions');
            const data = (response?.success && Array.isArray(response.data)) ? response.data : (Array.isArray(response) ? response : []);

            if (Array.isArray(data)) {
                // Sort by created_at desc (newest first)
                const sorted = data.sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateB - dateA;
                });

                const activityLogs = sorted.map(comp => ({
                    ...comp, // Keep full object for editing
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

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleDelete = async (e, id) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();

        if (window.confirm("Are you sure you want to delete this competition? This action cannot be undone.")) {
            try {
                const response = await api.del(`/api/admin/competition/${id}`);
                // In a perfect world we check response, but axios throws on error status
                setLogs(prev => prev.filter(log => log.id !== id));
                addToast("Competition deleted successfully.", "success");
            } catch (err) {
                console.error("Delete failed", err);
                addToast("Failed to delete competition.", "error");
            }
        }
    };

    const handleEdit = (e, competition) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedRepo(competition);
        setIsEditModalOpen(true);
    };

    const handleUpdate = (updatedCompetition) => {
        setLogs(prev => prev.map(log =>
            log.id === updatedCompetition[0].id
                ? { ...log, ...updatedCompetition[0], title: updatedCompetition[0].title }
                : log
        ));
        fetchLogs(); // Refresh to be safe
    };

    return (
        <div className="min-h-screen bg-background flex transition-colors duration-200">
            <Sidebar />
            <div className="flex-1 md:ml-sidebar p-4 md:p-8 pt-16 md:pt-8">
                <div className="w-[95%] mx-auto">
                    {/* Header */}
                    <div className="mb-8 relative text-center">
                        <Link to="/admin" className="absolute left-0 top-0 inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                            <ArrowLeft size={20} className="mr-2" />
                            Back to Dashboard
                        </Link>
                        <div className="text-center pt-8">
                            <h1 className="text-2xl font-bold text-foreground">System Activity Logs</h1>
                            <p className="text-muted mt-1">Full history of system actions and uploads.</p>
                        </div>
                    </div>

                    <div className="bg-card dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border dark:border-slate-700 flex justify-between items-center bg-muted/5 dark:bg-slate-900/50">
                            <div className="font-semibold text-foreground">Total Activities: {logs.length}</div>
                            {/* Placeholder for future filtering if needed */}
                        </div>

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
                            <div className="divide-y divide-border dark:divide-slate-700">
                                {logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-6 hover:bg-muted/5 transition-colors flex items-center justify-between group block relative"
                                    >
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="mt-1 p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors">
                                                        {log.title}
                                                    </h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {log.status === 'Success' ? 'Upload Success' : 'Failed'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-muted">
                                                    <div className="flex items-center gap-1">
                                                        <span>By:</span>
                                                        <span className="font-medium text-foreground">{log.user}</span>
                                                    </div>
                                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                                    <div>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleEdit(e, log)}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Competition"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, log.id)}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Competition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            {/* Link to view details */}
                                            <Link
                                                to={`/competitions/${log.id}`}
                                                className="ml-2 text-sm font-medium text-gray-400 hover:text-blue-600"
                                            >
                                                View &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <EditCompetitionModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                competition={selectedRepo}
                onUpdate={handleUpdate}
            />
        </div>
    );
};

export default ActivityLogs;
