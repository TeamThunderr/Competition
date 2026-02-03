import React, { useState, useRef } from 'react';
import Sidebar from './Sidebar';
import { Upload, FileText } from 'lucide-react';

const UploadCompetitions = () => {
    const [activeTab, setActiveTab] = useState('excel');
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
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
        departments: [] // Store selected departments
    });

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

    const handleFileSelect = () => {
        fileInputRef.current.click();
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : null;
            if (!user) {
                alert('You must be logged in');
                setUploading(false);
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/competition/upload`, {
                method: 'POST',
                headers: {
                    'x-user-id': user.id
                },
                body: formData
            });

            if (response.ok) {
                alert('Competitions uploaded successfully!');
                e.target.value = null; // Reset input
            } else {
                const error = await response.json();
                alert(`Upload failed: ${error.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error uploading file:', err);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (activeTab === 'manual') {
            if (!formData.title || !formData.organizer || !formData.platform || !formData.deadline || !formData.link) {
                alert('Please fill in all mandatory fields (Title, Organizer, Platform, Deadline, Link)');
                return;
            }
            if (!formData.departments || formData.departments.length === 0) {
                alert('Please select at least one target department (or "All Departments")');
                return;
            }
        }

        try {
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : null;
            if (!user) {
                alert('You must be logged in');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/competitions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    ...formData,
                    // Pass explicit values or let formData handle it
                    team_allowed: formData.team_allowed,
                    min_team_size: formData.min_team_size,
                    max_team_size: formData.max_team_size,
                    departments: formData.departments // Send array directly
                })
            });

            if (response.ok) {
                alert('Competition created successfully!');
                setFormData({
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
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (err) {
            console.error('Error uploading competition:', err);
            alert('Failed to upload competition');
        }
    };

    const handleCancel = () => {
        if (window.confirm("Are you sure you want to clear all fields?")) {
            setFormData({
                title: '',
                organizer: '',
                platform: 'Unstop',
                mode: 'Online',
                deadline: '',
                event_date: '',
                link: '',
                description: '',
                team_allowed: false,
                min_team_size: 1,
                max_team_size: 4,
                departments: []
            });
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />
            <div className="flex-1 md:ml-sidebar p-4 md:p-8 pt-16 md:pt-8">
                <div className="w-[95%] mx-auto">
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-foreground">Upload Competitions</h1>
                        <p className="text-gray-500 mt-1">Add new events to the global system via Excel or manual entry.</p>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-border mb-6">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('excel')}
                                className={`${activeTab === 'excel'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-muted hover:text-foreground hover:border-gray-300 dark:hover:border-gray-600'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Excel / CSV Upload
                            </button>
                            <button
                                onClick={() => setActiveTab('manual')}
                                className={`${activeTab === 'manual'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-muted hover:text-foreground hover:border-gray-300 dark:hover:border-gray-600'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Manual Entry
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    {activeTab === 'excel' && (
                        <div className="bg-card p-12 rounded-xl border border-border shadow-sm text-center">
                            <div
                                className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/5 transition-colors"
                                onClick={handleFileSelect}
                            >
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <div className="h-12 w-12 text-muted mb-4">
                                    <FileText className="w-full h-full" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground">Drag and drop Excel file here</h3>
                                <p className="text-muted text-sm mt-1 mb-6">or click to browse from computer</p>
                                <button className="bg-card border border-border text-foreground font-medium py-2 px-4 rounded-md hover:bg-muted/10 transition-colors pointer-events-none">
                                    Select File
                                </button>
                            </div>
                            <p className="text-xs text-muted mt-6">
                                Supported columns: Name, Deadline, Platform, Description, Link
                            </p>
                        </div>
                    )}

                    {activeTab === 'manual' && (
                        <div className="bg-card dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Competition Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="e.g. HackTheFuture 2025"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Platform <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            name="platform"
                                            required
                                            value={formData.platform}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm appearance-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                        >
                                            <option>Unstop</option>
                                            <option>Devfolio</option>
                                            <option>Devpost</option>
                                            <option>Hack2skill</option>
                                            <option>Others</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Organizer <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="organizer"
                                        required
                                        value={formData.organizer}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                        placeholder="e.g. Google, MLH"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode <span className="text-red-500">*</span></label>
                                    <select
                                        name="mode"
                                        required
                                        value={formData.mode}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    >
                                        <option>Online</option>
                                        <option>Offline</option>
                                        <option>Hybrid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Venue</label>
                                <input
                                    type="text"
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="e.g. Main Auditorium (if offline)"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Departments <span className="text-red-500">*</span></label>
                                <div className="flex flex-wrap gap-2">
                                    {['All', 'CSE', 'AIDS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(dept => (
                                        <button
                                            key={dept}
                                            onClick={() => toggleDepartment(dept)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${(formData.departments || []).includes(dept)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-border dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {dept === 'All' ? 'All Departments' : dept}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select "All Departments" for college-wide events.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">One Registration Deadline <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        name="deadline"
                                        required
                                        value={formData.deadline}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main Event Date</label>
                                    <input
                                        type="date"
                                        name="event_date"
                                        value={formData.event_date}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">More Info Link <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="link"
                                    required
                                    value={formData.link}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="https://"
                                />
                            </div>

                            {/* Team Settings */}
                            <div className="mb-6 bg-background dark:bg-slate-900/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="checkbox"
                                        name="team_allowed"
                                        id="team_allowed"
                                        checked={formData.team_allowed}
                                        onChange={(e) => setFormData(prev => ({ ...prev, team_allowed: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
                                    />
                                    <label htmlFor="team_allowed" className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow Team Participation</label>
                                </div>

                                {formData.team_allowed && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Min Team Size</label>
                                            <input
                                                type="number"
                                                name="min_team_size"
                                                min="1"
                                                value={formData.min_team_size}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Max Team Size</label>
                                            <input
                                                type="number"
                                                name="max_team_size"
                                                min="1"
                                                value={formData.max_team_size}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description <span className="text-red-500">*</span></label>
                                <textarea
                                    name="description"
                                    required
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm h-32 resize-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="Event details..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button className="px-6 py-2 bg-card dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-background dark:hover:bg-slate-600 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Add Competition
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadCompetitions;
