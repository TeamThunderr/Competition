import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar'; // Student Sidebar
import { ArrowLeft, User, Users, Upload, Trash2, Calendar, FileText, PlusCircle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { supabase } from '../../services/supabaseClient';
import { api } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';
import CustomDatePicker from '../../components/common/CustomDatePicker';

const ODRequestPage = () => {
    const { competitionId } = useParams();
    const navigate = useNavigate();

    // State
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isSolo, setIsSolo] = useState(false);
    const [existingODs, setExistingODs] = useState([]); // Store existing ODs

    useEffect(() => {
        const fetchODs = async () => {
            try {
                const data = await studentService.getMyODRequests();
                setExistingODs(data || []);
                // Removed blocking logic - allow extensions of PENDING ODs
            } catch (err) {
                console.error("Error fetching existing ODs:", err);
            }
        };
        fetchODs();
    }, []);

    // Alert Modal State
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info', // info, danger, success
        onConfirm: () => { }
    });

    const closeAlert = () => setAlertModal(prev => ({ ...prev, isOpen: false }));

    // Check for Overlaps (Immediate Feedback)
    const checkOverlap = (fromDate, toDate, ignoreODId = null) => {
        if (!fromDate || !toDate) return;
        const start = new Date(fromDate);
        const end = new Date(toDate);

        const conflict = existingODs.find(od => {
            // Must ignore the one we are extending
            if (ignoreODId && od.id === ignoreODId) return false;

            // User Requirement: Only BLOCK if it overlaps with a PENDING request.
            if (od.status !== 'PENDING') return false;

            // Don't check against self if editing (though this is new request page)
            if (od.competition_id === competitionId) return true; // Already requested for THIS competition

            const existStart = new Date(od.from_date);
            const existEnd = new Date(od.to_date);
            return (start <= existEnd && end >= existStart);
        });

        if (conflict) {
            // Immediate Popup as requested
            setAlertModal({
                isOpen: true,
                title: 'Pending Request Conflict',
                message: `You already have a PENDING OD request for:\n"${conflict.competitions?.title}"\nFrom: ${new Date(conflict.from_date).toLocaleDateString()} To: ${new Date(conflict.to_date).toLocaleDateString()}\n\nYou cannot submit a new request until this is processed.`,
                type: 'danger',
                onConfirm: closeAlert
            });
            // Reset dates to avoid submission
            setFormData(prev => ({ ...prev, from_date: '', to_date: '' }));
        }
    };

    // Form Data
    const [formData, setFormData] = useState({
        team_name: '',
        leader_name: '',
        leader_reg_no: '', // Fix: Initialize to empty string to avoid uncontrolled input warning
        section: '',
        academic_year: '2nd Year',
        department: 'CSE',
        proof_files: [],
        proof_urls: [],

        // OD Specific
        from_date: '',
        to_date: '',
        reason: '',

        // Team Members (Dynamic)
        members: [] // [{ name: '', reg_no: '' }]
    });

    const [competition, setCompetition] = useState(null);

    // Fetch Competition & User Details on Load
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Fetch Competition
                const { data: comp } = await supabase.from('competitions').select('title, event_date').eq('id', competitionId).single();
                if (comp) setCompetition(comp);

                // 2. Fetch User & Profile
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const user = session.user;
                    console.log("DEBUG: Auth User (from session):", user);

                    let { data: profile, error } = await supabase
                        .from('users')
                        .select('*, departments(name)')
                        .eq('id', user.id)
                        .maybeSingle();

                    // Fallback: Try fetching by email if ID mismatch
                    if (!profile && user.email) {
                        console.log("DEBUG: ID match failed, trying email fallback...");
                        const { data: profileByEmail, error: emailError } = await supabase
                            .from('users')
                            .select('*, departments(name)')
                            .eq('email', user.email)
                            .maybeSingle();

                        if (profileByEmail) {
                            profile = profileByEmail;
                            console.log("DEBUG: Found profile by email:", profile);
                        }
                    }

                    console.log("DEBUG: Final Profile Fetch - Profile:", profile, "Error:", error);

                    if (profile) {
                        const currentYear = new Date().getFullYear();
                        const currentMonth = new Date().getMonth(); // 0-11
                        // If before June (approx), we are ending the academic year. So 2026-2024 = 2nd Year.
                        // If after June, we are starting new. 2026-2024 + 1 = 3rd Year.
                        const calculatedYearVal = (currentMonth < 6)
                            ? (currentYear - (profile.admission_year || currentYear))
                            : (currentYear - (profile.admission_year || currentYear) + 1);

                        // Clamp between 1 and 4, fallback to 2nd if weird
                        const finalYear = Math.min(Math.max(calculatedYearVal, 1), 4);
                        const yearString = finalYear === 1 ? '1st Year' : finalYear === 2 ? '2nd Year' : finalYear === 3 ? '3rd Year' : '4th Year';

                        const newFormData = {
                            leader_name: profile.full_name || '',
                            leader_reg_no: profile.registration_no || '',
                            department: profile.departments?.name || 'CSE', // Fallback
                            section: profile.section || '',
                            academic_year: profile.admission_year ? yearString : '2nd Year',
                            // Preserve other fields
                            team_name: '',
                            proof_files: [],
                            proof_urls: [],
                            from_date: '',
                            to_date: '',
                            reason: '',
                            members: []
                        };
                        console.log("DEBUG: Setting Form Data:", newFormData);

                        setFormData(prev => ({
                            ...prev,
                            leader_name: profile.full_name || '',
                            leader_reg_no: profile.registration_no || '',
                            department: profile.departments?.name || 'CSE',
                            section: profile.section || '',
                            academic_year: profile.admission_year ? yearString : '2nd Year',
                        }));
                    }
                }
            } catch (e) {
                console.error("OD Request Init Error:", e);
            }
        };
        init();
    }, [competitionId]);

    // Extension Detection
    const [isExtension, setIsExtension] = useState(null); // { prevOD: ... }
    const [dateError, setDateError] = useState(null); // For overlap errors

    // Check for Overlaps AND Extensions
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'from_date' || name === 'to_date') {
            const newFrom = name === 'from_date' ? value : formData.from_date;
            const newTo = name === 'to_date' ? value : formData.to_date;

            // Reset states
            setIsExtension(null);
            setDateError(null);

            if (newFrom) {
                // Check Extension: Is newFrom == prevEnd + 1 day?
                const newStart = new Date(newFrom);
                const extensionOD = existingODs.find(od => {
                    // ONLY VERIFIED ODs can be extended (per user requirement)
                    if (od.status !== 'VERIFIED') return false;

                    const prevEnd = new Date(od.to_date);
                    const diffTime = newStart - prevEnd;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // Must be exactly 1 day after previous OD ends
                    return diffDays === 1;
                });

                if (extensionOD) {
                    // Show extension modal
                    setIsExtension(extensionOD);
                    setDateError(null);

                    const extendedEndDate = formData.to_date ? new Date(formData.to_date).toLocaleDateString() : '(select end date)';

                    setAlertModal({
                        isOpen: true,
                        title: '🔗 Extending Your Previous OD',
                        message: `These dates will extend your existing OD for "${extensionOD.competitions?.title || 'Competition'}".\n\nCurrent: ${new Date(extensionOD.from_date).toLocaleDateString()} to ${new Date(extensionOD.to_date).toLocaleDateString()}\nExtended: ${new Date(extensionOD.from_date).toLocaleDateString()} to ${extendedEndDate}`,
                        type: 'info',
                        onConfirm: closeAlert
                    });
                } else {
                    // Check for date overlaps with ANY existing OD (not extension)
                    if (newFrom && newTo) {
                        const newStartDate = new Date(newFrom);
                        const newEndDate = new Date(newTo);

                        const overlappingOD = existingODs.find(od => {
                            // Check all statuses except REJECTED
                            if (od.status === 'REJECTED') return false;

                            const existingStart = new Date(od.from_date);
                            const existingEnd = new Date(od.to_date);

                            // Check if dates overlap
                            return (newStartDate <= existingEnd && newEndDate >= existingStart);
                        });

                        if (overlappingOD) {
                            // Show error modal
                            setDateError({
                                message: `These dates overlap with your existing ${overlappingOD.status} OD`,
                                existingOD: overlappingOD
                            });

                            setAlertModal({
                                isOpen: true,
                                title: '⚠️ Oops! These dates won\'t work',
                                message: `You already have an OD for these dates.\n\n📌 ${overlappingOD.competitions?.title || 'Competition'}\n📅 ${new Date(overlappingOD.from_date).toLocaleDateString()} to ${new Date(overlappingOD.to_date).toLocaleDateString()}\nStatus: ${overlappingOD.status}\n\nPlease choose different dates.`,
                                type: 'danger',
                                onConfirm: () => {
                                    // Clear the dates so user must select again
                                    setFormData(prev => ({
                                        ...prev,
                                        from_date: '',
                                        to_date: ''
                                    }));
                                    setDateError(null);
                                    closeAlert();
                                }
                            });
                        }
                    }
                }
            }

            if (newFrom && newTo) {
                checkOverlap(newFrom, newTo);
            }
        }
    };

    // Dynamic Members
    const addMember = () => {
        setFormData(prev => ({
            ...prev,
            members: [...prev.members, { name: '', reg_no: '' }]
        }));
    };

    const removeMember = (index) => {
        setFormData(prev => ({
            ...prev,
            members: prev.members.filter((_, i) => i !== index)
        }));
    };

    const handleMemberChange = (index, field, value) => {
        const updatedMembers = [...formData.members];
        updatedMembers[index][field] = value;
        setFormData({ ...formData, members: updatedMembers });
    };

    // File Handlers
    const handleFileChange = (e) => {
        if (e.target.files) {
            setFormData(prev => ({ ...prev, proof_files: [...prev.proof_files, ...Array.from(e.target.files)] }));
        }
    };
    const removeFile = (i) => setFormData(prev => ({ ...prev, proof_files: prev.proof_files.filter((_, idx) => idx !== i) }));

    const handleNext = () => {
        if (step === 1) {
            if (!formData.leader_name || !formData.section) return setAlertModal({ isOpen: true, title: 'Missing Info', message: "Please fill leader details.", type: 'danger', onConfirm: closeAlert });
            if (!isSolo && !formData.team_name) return setAlertModal({ isOpen: true, title: 'Missing Info', message: "Team Name is required.", type: 'danger', onConfirm: closeAlert });
            // Validate members
            if (!isSolo && formData.members.some(m => !m.name || !m.reg_no)) return setAlertModal({ isOpen: true, title: 'Missing Info', message: "Please fill all team member details.", type: 'danger', onConfirm: closeAlert });

            setStep(2);
        } else if (step === 2) {
            if (!formData.from_date || !formData.to_date || !formData.reason) return setAlertModal({ isOpen: true, title: 'Missing Info', message: "Please fill OD details.", type: 'danger', onConfirm: closeAlert });
            // No step 3 anymore
        }
    };

    const handleSubmit = async () => {
        // No proof file check logic anymore (Automated backend fetch)

        setLoading(true);
        try {
            // Payload - Unified for Direct HOD Request
            const payload = {
                competition_id: competitionId,
                is_solo: isSolo,
                team_name: isSolo ? null : formData.team_name,
                leader_name: formData.leader_name,
                section: formData.section.toUpperCase(),
                department: formData.department,
                academic_year: formData.academic_year,
                // proof_urls removed - handled by backend automation

                // OD Details (Required Now)
                from_date: formData.from_date,
                to_date: formData.to_date,
                reason: formData.reason,

                // NEW: Members Info
                members_info: isSolo ? [] : formData.members
            };

            console.log("DEBUG: Submitting Verification Payload:", payload);

            const response = await api.post('/api/teams/submit-verification', payload);
            console.log("DEBUG: Submit Response:", response);

            setAlertModal({
                isOpen: true,
                title: 'Success',
                message: "OD Request Submitted Successfully!",
                type: 'success',
                onConfirm: () => {
                    closeAlert();
                    navigate('/student');
                }
            });

        } catch (err) {
            console.error(err);
            setAlertModal({
                isOpen: true,
                title: 'Submission Failed',
                message: err.response?.data?.error || err.message,
                type: 'danger',
                onConfirm: closeAlert
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-background min-h-screen text-foreground font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 md:ml-sidebar p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Request OD</h1>
                        <p className="text-gray-500">{competition?.title || 'Competition'} Verification</p>
                    </div>
                </div>

                {/* Wizard Container */}
                {/* Wizard Container - Removed overflow-hidden to fix DatePicker clipping */}
                {/* Adaptive Container - Balanced width with smooth transitions */}
                <div className="bg-white dark:bg-card rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 w-full max-w-5xl mx-auto flex flex-col min-h-[450px] transition-all duration-300 ease-in-out">
                    {/* Steps */}
                    <div className="flex border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                        {['Team Details', 'OD Info'].map((label, idx) => (
                            <div key={idx} className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${step === idx + 1 ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-gray-400 dark:text-gray-500'}`}>
                                {idx + 1}. {label}
                            </div>
                        ))}
                    </div>

                    <div className="p-8 flex-1">
                        {/* STEP 1: Team & Leader */}
                        {step === 1 && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* Participation Type */}
                                <div className="flex gap-4 mb-6">
                                    <button onClick={() => setIsSolo(false)} className={`flex-1 p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${!isSolo ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <Users size={24} />
                                        <span className="font-semibold">Team Participation</span>
                                    </button>
                                    <button onClick={() => setIsSolo(true)} className={`flex-1 p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${isSolo ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <User size={24} />
                                        <span className="font-semibold">Individual</span>
                                    </button>
                                </div>

                                {!isSolo && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Name</label>
                                        <input type="text" name="team_name" value={formData.team_name} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white" placeholder="Enter Team Name" />
                                    </div>
                                )}

                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase">Leader Details</h3>

                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name</label>
                                            <input type="text" value={formData.leader_name} disabled readOnly className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed select-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reg No</label>
                                            <input type="text" value={formData.leader_reg_no} disabled readOnly className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed uppercase select-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
                                        <input type="text" name="section" value={formData.section} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white uppercase" placeholder="e.g. A" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                                        <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-800 dark:text-white">
                                            <option value="CSE">CSE</option><option value="IT">IT</option><option value="AIDS">AIDS</option><option value="ECE">ECE</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                                    <select name="academic_year" value={formData.academic_year} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-800 dark:text-white">
                                        <option value="1st Year">1st Year</option><option value="2nd Year">2nd Year</option><option value="3rd Year">3rd Year</option><option value="4th Year">4th Year</option>
                                    </select>
                                </div>

                                {/* Team Members Section (Hidden if Solo) */}
                                {!isSolo && (
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Team Members</h3>
                                            <button type="button" onClick={addMember} className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-1 hover:underline">
                                                <PlusCircle size={16} /> Add Member
                                            </button>
                                        </div>

                                        {formData.members.length === 0 && <p className="text-sm text-gray-400 italic">No members added yet.</p>}

                                        <div className="space-y-3">
                                            {formData.members.map((member, idx) => (
                                                <div key={idx} className="flex gap-3 items-start">
                                                    <div className="flex-1">
                                                        <input
                                                            placeholder="Member Name"
                                                            value={member.name}
                                                            onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                                                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm outline-none focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="w-32">
                                                        <input
                                                            placeholder="Reg No"
                                                            value={member.reg_no}
                                                            onChange={(e) => handleMemberChange(idx, 'reg_no', e.target.value)}
                                                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm outline-none focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white uppercase"
                                                        />
                                                    </div>
                                                    <button onClick={() => removeMember(idx)} className="p-2 text-gray-400 hover:text-red-500 transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 2: OD Info */}
                        {step === 2 && (
                            <div className="space-y-6 animate-fadeIn">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">OD Request Details</h3>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <CustomDatePicker
                                            label="From Date"
                                            name="from_date"
                                            value={formData.from_date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <CustomDatePicker
                                            label="To Date"
                                            name="to_date"
                                            value={formData.to_date}
                                            onChange={handleInputChange}
                                            minDate={formData.from_date || undefined}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for OD</label>
                                    <textarea name="reason" value={formData.reason} onChange={handleInputChange} rows="4" className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-white" placeholder="Explain why you need OD..." />
                                </div>
                                {/* Spacer for DatePicker Poppver */}
                                <div className="h-20"></div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-between flex-shrink-0">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)} className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium">Back</button>
                        ) : (
                            <div></div> // Spacer
                        )}

                        {step < 2 ? (
                            <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 dark:shadow-none">Next Step</button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading || dateError}
                                className="px-8 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm shadow-green-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                            >
                                {loading ? 'Submitting...' : (isExtension ? 'Extend OD' : 'Submit OD Request')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Global Alert Modal */}
            <ConfirmModal
                isOpen={alertModal.isOpen}
                onClose={alertModal.onClose || closeAlert}
                onConfirm={alertModal.onConfirm}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                confirmText={alertModal.confirmText || "Okay"}
                cancelText={alertModal.cancelText || "Close"}
            />
        </div>
    );
};

export default ODRequestPage;
