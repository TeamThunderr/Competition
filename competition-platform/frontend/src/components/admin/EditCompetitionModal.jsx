import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CustomDatePicker from '../common/CustomDatePicker';
import { useToast } from '../../contexts/ToastContext';

const EditCompetitionModal = ({ isOpen, onClose, competition, onUpdate }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        title: '',
        organizer: '',
        platform: 'Unstop',
        mode: 'Online',
        venue: '',
        deadline: '',
        event_date: '',
        link: '',
        description: '',
        team_allowed: false,
        min_team_size: 1,
        max_team_size: 4,
        departments: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (competition) {
            setFormData({
                title: competition.title || '',
                organizer: competition.organizer || '',
                platform: competition.platform || 'Unstop',
                mode: competition.mode || 'Online',
                venue: competition.venue || '',
                deadline: competition.registration_deadline ? new Date(competition.registration_deadline).toISOString().split('T')[0] : '',
                event_date: competition.event_date ? new Date(competition.event_date).toISOString().split('T')[0] : '',
                link: competition.external_link || '',
                description: competition.description || '',
                team_allowed: competition.team_allowed || false,
                min_team_size: competition.min_team_size || 1,
                max_team_size: competition.max_team_size || 4,
                departments: Array.isArray(competition.departments) ? competition.departments : (competition.departments ? [competition.departments] : [])
            });
        }
    }, [competition]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleDepartment = (dept) => {
        setFormData(prev => {
            const current = prev.departments || [];
            if (dept === 'All') {
                return { ...prev, departments: ['All'] };
            }
            let newDepts = current.filter(d => d !== 'All');
            if (newDepts.includes(dept)) {
                newDepts = newDepts.filter(d => d !== dept);
            } else {
                newDepts.push(dept);
            }
            return { ...prev, departments: newDepts };
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/competition/${competition.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                onUpdate(data.data); // Pass updated data back - parent will show toast
                onClose();
            } else {
                const error = await response.json();
                addToast(`Update failed: ${error.message}`, "error");
            }
        } catch (err) {
            console.error("Failed to update competition", err);
            addToast("Failed to update competition.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
                <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-card z-10">
                    <h2 className="text-xl font-bold text-foreground">Edit Competition</h2>
                    <button onClick={onClose} className="text-muted hover:text-foreground">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Platform</label>
                            <select
                                name="platform"
                                value={formData.platform}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                            >
                                {['Unstop', 'Devfolio', 'Devpost', 'Hack2skill', 'Others'].map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Organizer</label>
                            <input
                                type="text"
                                name="organizer"
                                value={formData.organizer}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Mode</label>
                            <select
                                name="mode"
                                value={formData.mode}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                            >
                                {['Online', 'Offline', 'Hybrid'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Venue</label>
                        <input
                            type="text"
                            name="venue"
                            value={formData.venue}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                            placeholder="e.g. Main Auditorium (if offline)"
                        />
                    </div>

                    {/* Departments */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Target Departments</label>
                        <div className="flex flex-wrap gap-2">
                            {['All', 'CSE', 'AIDS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => toggleDepartment(dept)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${(formData.departments || []).includes(dept)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-background text-foreground border-border hover:bg-muted/10'
                                        }`}
                                >
                                    {dept === 'All' ? 'All' : dept}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dates & Link */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <CustomDatePicker
                                label="Deadline"
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div>
                            <CustomDatePicker
                                label="Event Date"
                                name="event_date"
                                value={formData.event_date}
                                onChange={handleInputChange}
                                minDate={formData.deadline || undefined}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Link</label>
                        <input
                            type="text"
                            name="link"
                            value={formData.link}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                        />
                    </div>

                    {/* Team Settings */}
                    <div className="bg-muted/10 p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                name="team_allowed"
                                id="modal_team_allowed"
                                checked={formData.team_allowed}
                                onChange={(e) => setFormData(prev => ({ ...prev, team_allowed: e.target.checked }))}
                                className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500"
                            />
                            <label htmlFor="modal_team_allowed" className="text-sm font-medium text-foreground">Allow Team Participation</label>
                        </div>
                        {formData.team_allowed && (
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-muted mb-1">Min Team Size</label>
                                    <input
                                        type="number"
                                        name="min_team_size"
                                        min="1"
                                        value={formData.min_team_size}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted mb-1">Max Team Size</label>
                                    <input
                                        type="number"
                                        name="max_team_size"
                                        min="1"
                                        value={formData.max_team_size}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-border rounded-lg text-sm h-24 resize-none bg-background text-foreground"
                        ></textarea>
                    </div>
                </div>

                <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/10 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/20">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditCompetitionModal;
