import React, { useState, useEffect } from 'react';
import StudentSidebar from './Sidebar';
import { Upload, Calendar, FileText, Send, AlertCircle, Lock, Check, Clock } from 'lucide-react';
import { getAllCompetitions, requestOD } from '../../services/studentService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const ODLetter = () => {
    const [formData, setFormData] = useState({
        competitionId: '',
        date: '',
        reason: '',
        file: null
    });
    const [submitted, setSubmitted] = useState(false);
    const [existingRequests, setExistingRequests] = useState([]);
    const [eligibleCompetitions, setEligibleCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const fetchCompetitions = async () => {
        try {
            const data = await getAllCompetitions();

            // 1. Existing Requests (Pending, Approved, Rejected)
            const requested = data.filter(comp => comp.my_od);
            setExistingRequests(requested);

            // 2. Eligible for New Request (Shortlisted AND No Request)
            // User requested: "once rejected then ... again a form can be submitted but only for other competitions"
            // This implies strict "One Shot" policy? Or maybe they meant "If rejected, you can't try THIS one again".
            // Let's filter out ANY local request for now to be safe and avoid conflicts.
            const eligible = data.filter(comp =>
                comp.my_status?.is_shortlisted && !comp.my_od
            );
            setEligibleCompetitions(eligible);
        } catch (err) {
            console.error("Failed to load competitions", err);
            setError("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'competitionId') {
            const selected = eligibleCompetitions.find(c => c.id === parseInt(value));
            if (selected && selected.event_date) {
                const dateStr = new Date(selected.event_date).toISOString().split('T')[0];
                setFormData(prev => ({ ...prev, date: dateStr }));
            }
        }
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await requestOD(formData.competitionId, formData.reason);
            setSubmitted(true);
            setFormData({ competitionId: '', date: '', reason: '', file: null });
            fetchCompetitions(); // Refresh lists
        } catch (err) {
            // Handle 409 Conflict (Duplicate) gracefully
            if (err.response && err.response.status === 409) {
                setSubmitted(true); // Show success state anyway
                fetchCompetitions();
                return;
            }

            console.error("OD Request Error:", err);
            const errMsg = err.response?.data?.error || "Failed to submit request.";
            setError(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const getDaysLeft = (dateString) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-200">
                <RoleBasedLoader role="STUDENT" />
            </div>
        );
    }

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">On-Duty (OD) Management</h1>
                        <p className="text-gray-500 mt-1">Track your OD status and request permissions for upcoming competitions.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: Existing Requests Status */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <FileText size={20} className="text-blue-600" />
                                My Applications
                            </h2>

                            {existingRequests.length === 0 ? (
                                <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                                    <p>No OD requests submitted yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {existingRequests.map(comp => (
                                        <div key={comp.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{comp.title}</h3>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {new Date(comp.event_date).toLocaleDateString()}
                                                    </span>

                                                    {comp.my_od.status === 'APPROVED' && (
                                                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
                                                            <Clock size={12} />
                                                            {getDaysLeft(comp.event_date)} Days to go
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                {comp.my_od.status === 'PENDING' && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                                                        ⏳ Pending Approval
                                                    </span>
                                                )}
                                                {comp.my_od.status === 'APPROVED' && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-100">
                                                        ✅ OD Granted
                                                    </span>
                                                )}
                                                {comp.my_od.status === 'REJECTED' && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-100">
                                                        ❌ Request Rejected
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: New Request Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-8">
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Send size={18} className="text-blue-600" />
                                        New Request
                                    </h2>
                                </div>

                                <div className="p-6">
                                    {submitted ? (
                                        <div className="text-center py-8">
                                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Send size={24} />
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1">Sent!</h3>
                                            <p className="text-sm text-gray-500 mb-4">HOD will review it shortly.</p>
                                            <button
                                                onClick={() => setSubmitted(false)}
                                                className="text-sm text-blue-600 hover:underline font-medium"
                                            >
                                                Submit Another
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            {error && (
                                                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex gap-2">
                                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                                    <span className="flex-1">{error}</span>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Competition</label>
                                                <select
                                                    name="competitionId"
                                                    required
                                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    value={formData.competitionId}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">-- Select --</option>
                                                    {eligibleCompetitions.map(comp => (
                                                        <option key={comp.id} value={comp.id}>{comp.title}</option>
                                                    ))}
                                                </select>
                                                {eligibleCompetitions.length === 0 && (
                                                    <p className="text-xs text-orange-500 mt-1">No shortlisted competitions available.</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                        <Lock size={14} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="date"
                                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm outline-none text-gray-600 font-medium select-none"
                                                        value={formData.date ? new Date(formData.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                                        readOnly
                                                        title="Date is locked to the competition event"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                    <Check size={10} className="text-green-500" />
                                                    Synced with Event Schedule
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason</label>
                                                <textarea
                                                    name="reason"
                                                    rows="3"
                                                    required
                                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Why do you need OD?"
                                                    value={formData.reason}
                                                    onChange={handleChange}
                                                ></textarea>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={submitting || eligibleCompetitions.length === 0}
                                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                            >
                                                {submitting ? 'Sending...' : 'Submit Request'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        </>
    );
};

export default ODLetter;
