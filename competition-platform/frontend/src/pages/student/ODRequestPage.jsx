import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar'; // Student Sidebar
import { ArrowLeft, User, Users, Upload, Trash2, Calendar, FileText, PlusCircle, CheckCircle } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { supabase } from '../../services/supabaseClient';
import { api } from '../../services/api';

const ODRequestPage = () => {
    const { competitionId } = useParams();
    const navigate = useNavigate();

    // State
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isSolo, setIsSolo] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        team_name: '',
        leader_name: '',
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

    // Fetch Competition Details on Load
    useEffect(() => {
        const fetchComp = async () => {
            try {
                // We reuse checkTeamStatus to see if they already have a team?
                // Or just fetch basic competition info.
                // Simpler: Fetch competition title etc.
                const { data } = await supabase.from('competitions').select('title, event_date').eq('id', competitionId).single();
                if (data) setCompetition(data);

                // Pre-fill user details? 
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
                    if (profile) {
                        setFormData(prev => ({
                            ...prev,
                            leader_name: profile.full_name,
                            department: profile.department_id || 'CSE', // Fallback
                            section: profile.section,
                            academic_year: '2nd Year' // Default or fetch if stored
                        }));
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchComp();
    }, [competitionId]);

    // Handlers
    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
            if (!formData.leader_name || !formData.section) return alert("Please fill leader details.");
            if (!isSolo && !formData.team_name) return alert("Team Name is required.");
            // Validate members
            if (!isSolo && formData.members.some(m => !m.name || !m.reg_no)) return alert("Please fill all team member details.");

            setStep(2);
        } else if (step === 2) {
            if (!formData.from_date || !formData.to_date || !formData.reason) return alert("Please fill OD details.");
            setStep(3);
        }
    };

    const handleSubmit = async () => {
        if (formData.proof_files.length === 0) return alert("Please upload proof.");

        setLoading(true);
        try {
            let uploadedUrls = [];

            // Upload Files
            for (const file of formData.proof_files) {
                const fileName = `od_req/${competitionId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
                const { error } = await supabase.storage.from('proofs').upload(fileName, file);
                if (error) throw error;
                const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
                uploadedUrls.push(data.publicUrl);
            }

            // Payload
            const payload = {
                competition_id: competitionId,
                is_solo: isSolo, // Backend validates this
                team_name: isSolo ? null : formData.team_name,
                leader_name: formData.leader_name,
                section: formData.section.toUpperCase(), // Normalize
                department: formData.department, // Text code
                academic_year: formData.academic_year,
                proof_urls: uploadedUrls,

                // OD Details
                from_date: formData.from_date,
                to_date: formData.to_date,
                reason: formData.reason,

                // NEW: Members Info
                members_info: isSolo ? [] : formData.members
            };

            await api.post('/api/teams/submit-verification', payload);
            alert("OD Request Submitted Successfully!");
            navigate('/student'); // Go back to dashboard

        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 p-8">
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
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-3xl mx-auto">
                    {/* Steps */}
                    <div className="flex border-b border-gray-100">
                        {['Team Details', 'OD Info', 'Proofs'].map((label, idx) => (
                            <div key={idx} className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${step === idx + 1 ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400'}`}>
                                {idx + 1}. {label}
                            </div>
                        ))}
                    </div>

                    <div className="p-8">
                        {/* STEP 1: Team & Leader */}
                        {step === 1 && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* Participation Type */}
                                <div className="flex gap-4 mb-6">
                                    <button onClick={() => setIsSolo(false)} className={`flex-1 p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${!isSolo ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <Users size={24} />
                                        <span className="font-semibold">Team Participation</span>
                                    </button>
                                    <button onClick={() => setIsSolo(true)} className={`flex-1 p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${isSolo ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <User size={24} />
                                        <span className="font-semibold">Individual</span>
                                    </button>
                                </div>

                                {!isSolo && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                                        <input type="text" name="team_name" value={formData.team_name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter Team Name" />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name (Leader)</label>
                                        <input type="text" name="leader_name" value={formData.leader_name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                        <input type="text" name="section" value={formData.section} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="e.g. A" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                        <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none">
                                            <option value="CSE">CSE</option><option value="IT">IT</option><option value="AIDS">AIDS</option><option value="ECE">ECE</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                        <select name="academic_year" value={formData.academic_year} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg outline-none">
                                            <option value="1st Year">1st Year</option><option value="2nd Year">2nd Year</option><option value="3rd Year">3rd Year</option><option value="4th Year">4th Year</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Team Members Section (Hidden if Solo) */}
                                {!isSolo && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold text-gray-800">Team Members</h3>
                                            <button type="button" onClick={addMember} className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">
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
                                                            className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div className="w-32">
                                                        <input
                                                            placeholder="Reg No"
                                                            value={member.reg_no}
                                                            onChange={(e) => handleMemberChange(idx, 'reg_no', e.target.value)}
                                                            className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-500 uppercase"
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
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">OD Request Details</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                        <input type="date" name="from_date" value={formData.from_date} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                        <input type="date" name="to_date" value={formData.to_date} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for OD</label>
                                    <textarea name="reason" value={formData.reason} onChange={handleInputChange} rows="4" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Explain why you need OD..." />
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Proofs */}
                        {step === 3 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-8 hover:bg-blue-100 transition-colors cursor-pointer relative text-center">
                                    <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*,application/pdf" />
                                    <Upload className="mx-auto text-blue-500 mb-4" size={48} />
                                    <p className="text-gray-700 font-medium">Click to upload Proofs</p>
                                    <p className="text-sm text-gray-500 mt-1">Screenshots, Registration Confirmations (JPG, PNG, PDF)</p>
                                </div>
                                <div className="space-y-2">
                                    {formData.proof_files.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
                                            <span className="text-sm text-gray-700 flex items-center gap-2"><FileText size={16} className="text-blue-500" /> {file.name}</span>
                                            <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)} className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Back</button>
                        ) : (
                            <div></div> // Spacer
                        )}

                        {step < 3 ? (
                            <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm shadow-blue-200">Next Step</button>
                        ) : (
                            <button onClick={handleSubmit} disabled={loading} className="px-8 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm shadow-green-200 disabled:opacity-70 disabled:cursor-wait">
                                {loading ? 'Submitting...' : 'Submit Verification'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ODRequestPage;
