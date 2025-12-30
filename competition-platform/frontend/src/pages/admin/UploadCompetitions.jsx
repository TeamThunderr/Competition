import React, { useState, useRef } from 'react';
import Sidebar from './Sidebar';
import { Upload, FileText } from 'lucide-react';


const UploadCompetitions = () => {
    const [activeTab, setActiveTab] = useState('excel');
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        platform: 'Unstop',
        deadline: '',
        link: '',
        description: '',
        min_team_size: 1,
        max_team_size: 4
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

            const response = await fetch('http://localhost:5000/api/admin/competition/upload', {
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
            if (!formData.title || !formData.platform || !formData.deadline || !formData.link || !formData.description) {
                alert('Please fill in all mandatory fields');
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

            const response = await fetch('http://localhost:5000/api/competitions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    ...formData,
                    team_allowed: true,
                    min_team_size: formData.min_team_size,
                    max_team_size: formData.max_team_size
                })
            });

            if (response.ok) {
                alert('Competition created successfully!');
                setFormData({
                    title: '',
                    platform: 'Unstop',
                    deadline: '',
                    link: '',
                    description: '',
                    min_team_size: 1,
                    max_team_size: 4
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

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Upload Competitions</h1>
                    <p className="text-gray-500 mt-1">Add new events to the global system via Excel or manual entry.</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('excel')}
                            className={`${activeTab === 'excel'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Excel / CSV Upload
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`${activeTab === 'manual'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Manual Entry
                        </button>
                    </nav>
                </div>

                {/* Content */}
                {activeTab === 'excel' && (
                    <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={handleFileSelect}
                        >
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <div className="h-12 w-12 text-gray-400 mb-4">
                                <FileText className="w-full h-full" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Drag and drop Excel file here</h3>
                            <p className="text-gray-500 text-sm mt-1 mb-6">or click to browse from computer</p>
                            <button className="bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors pointer-events-none">
                                Select File
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-6">
                            Supported columns: Name, Deadline, Platform, Description, Link
                        </p>
                    </div>
                )}

                {activeTab === 'manual' && (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Competition Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder="e.g. HackTheFuture 2025"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Platform <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        name="platform"
                                        required
                                        value={formData.platform}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm appearance-none bg-white"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="deadline"
                                        required
                                        value={formData.deadline}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">More Info Link <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="link"
                                    required
                                    value={formData.link}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder="https://"
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                            <textarea
                                name="description"
                                required
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm h-32 resize-none"
                                placeholder="Event details..."
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
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
    );
};

export default UploadCompetitions;
