import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Upload, FileText } from 'lucide-react';

const UploadCompetitions = () => {
    const [activeTab, setActiveTab] = useState('excel'); // 'excel' or 'manual'

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
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center">
                            <div className="h-12 w-12 text-gray-400 mb-4">
                                <FileText className="w-full h-full" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Drag and drop Excel file here</h3>
                            <p className="text-gray-500 text-sm mt-1 mb-6">or click to browse from computer</p>
                            <button className="bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Competition Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder="e.g. HackTheFuture 2025"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                                <div className="relative">
                                    <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm appearance-none bg-white">
                                        <option>Devfolio</option>
                                        <option>Unstop</option>
                                        <option>HackerRank</option>
                                        <option>Other</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        placeholder="dd-mm-yyyy"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">More Info Link</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    placeholder="https://"
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm h-32 resize-none"
                                placeholder="Event details..."
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
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
