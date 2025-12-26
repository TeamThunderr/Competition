import React, { useState } from 'react';
import StudentSidebar from './Sidebar';
import { Upload, Calendar, FileText, Send } from 'lucide-react';

const ODLetter = () => {
    const [formData, setFormData] = useState({
        competition: '',
        date: '',
        reason: '',
        file: null
    });
    const [submitted, setSubmitted] = useState(false);

    // Mock active competitions for the dropdown
    const activeCompetitions = [
        { id: 1, title: 'Hackathon 2024 - IIT Madras' },
        { id: 2, title: 'CodeQuest - NIT Trichy' },
        { id: 3, title: 'AI Summit - Bangalore' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        // Mock submission logic
        console.log("OD Request Submitted:", formData);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000); // Reset after 3 seconds
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StudentSidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Request OD Letter</h1>
                        <p className="text-gray-500 mt-1">Submit a request for On-Duty (OD) for competition participation.</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-800">OD Request Form</h2>
                        </div>

                        <div className="p-8">
                            {submitted ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Send size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
                                    <p className="text-gray-500">Your OD request has been sent to the HOD for approval.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Competition Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Competition <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                                                    value={formData.competition}
                                                    onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                                                >
                                                    <option value="">-- Choose a Competition --</option>
                                                    {activeCompetitions.map(comp => (
                                                        <option key={comp.id} value={comp.title}>{comp.title}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Date Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Event <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                    <Calendar size={18} />
                                                </div>
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Proof / Invitation <span className="text-red-500">*</span></label>
                                        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors bg-gray-50">
                                            <div className="space-y-1 text-center">
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="flex text-sm text-gray-600">
                                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                                        <span>Upload a file</span>
                                                        <input id="file-upload" name="file-upload" type="file" required={!formData.file} className="sr-only" onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })} />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">PDF, PNG, JPG up to 5MB</p>
                                                {formData.file && (
                                                    <p className="text-sm text-green-600 font-medium mt-2">Selected: {formData.file.name}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason / Description <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                                                <FileText size={18} />
                                            </div>
                                            <textarea
                                                rows="4"
                                                required
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                placeholder="Briefly explain why you are requesting OD..."
                                                value={formData.reason}
                                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            className="inline-flex justify-center items-center py-3 px-8 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                        >
                                            Submit Request
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ODLetter;
