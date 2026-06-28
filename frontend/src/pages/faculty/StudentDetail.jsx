import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getStudentDetails, updateStudentSection } from '../../services/facultyService';
import StudentProfileView from '../common/StudentProfileView';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import { useToast } from '../../contexts/ToastContext';

const StudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isChangeSectionModalOpen, setIsChangeSectionModalOpen] = useState(false);
    const [newSection, setNewSection] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getStudentDetails(id);
                setStudent(data);
            } catch (err) {
                console.error("Failed to fetch student details", err);
                const msg = err.response?.data?.message || err.message || "Failed to load student details.";
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    const handleChangeSectionSubmit = async (e) => {
        e.preventDefault();
        if (!newSection.trim()) return;

        setIsSubmitting(true);
        try {
            await updateStudentSection(id, newSection.trim().toUpperCase());
            addToast('Section updated successfully', 'success');
            setIsChangeSectionModalOpen(false);
            
            // Refresh student details
            try {
                const data = await getStudentDetails(id);
                setStudent(data);
            } catch (fetchErr) {
                // If faculty loses access after changing the section, redirect to list
                if (fetchErr.response?.status === 403 || fetchErr.response?.status === 404) {
                    navigate('/faculty/students');
                } else {
                    console.error("Failed to refresh student details", fetchErr);
                    addToast('Student updated, but failed to refresh details', 'error');
                }
            }
        } catch (err) {
            console.error("Failed to update section", err);
            addToast(err.response?.data?.message || err.message || 'Failed to update section', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-background min-h-screen items-center justify-center">
                <RoleBasedLoader role="FACULTY" />
            </div>
        );
    }

    if (error) {
        return (
            <>
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                    <button
                        onClick={() => navigate('/faculty/students')}
                        className="mt-4 flex items-center gap-2 text-muted hover:text-foreground"
                    >
                        <ArrowLeft size={20} /> Back to List
                    </button>
            </>
        );
    }

    return (
        <>
                {/* Header with Back Button */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/faculty/students')}
                        className="flex items-center gap-2 text-muted hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} /> Back to Student List
                    </button>
                </div>

                {/* Shared Profile View */}
                <StudentProfileView 
                    student={student} 
                    onEditSection={() => {
                        setNewSection(student.profile.section);
                        setIsChangeSectionModalOpen(true);
                    }}
                />

                {/* Change Section Modal */}
                {isChangeSectionModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border p-6 animate-in fade-in zoom-in-95">
                            <h2 className="text-xl font-bold text-foreground mb-4">Change Section</h2>
                            <p className="text-sm text-muted mb-4">
                                Enter the new section for <strong>{student.profile.name}</strong>. They will be moved out of your assigned section if you enter a different one.
                            </p>
                            <form onSubmit={handleChangeSectionSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-foreground mb-1">New Section</label>
                                    <input
                                        type="text"
                                        value={newSection}
                                        onChange={(e) => setNewSection(e.target.value)}
                                        placeholder="e.g., A, B, C"
                                        className="w-full px-3 py-2 bg-muted/5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsChangeSectionModalOpen(false)}
                                        className="px-4 py-2 text-muted hover:text-foreground transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isSubmitting ? 'Updating...' : 'Update Section'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </>
    );
};

export default StudentDetail;
