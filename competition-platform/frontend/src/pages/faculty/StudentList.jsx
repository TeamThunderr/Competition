import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Upload, Search, FileSpreadsheet, X } from 'lucide-react';

const StudentList = () => {
    const [isUploadMode, setIsUploadMode] = useState(false);

    // Placeholder data structure without specific details
    const students = [
        { rollNo: '---', name: '---', section: '-', email: '---', status: 'Active' },
        { rollNo: '---', name: '---', section: '-', email: '---', status: 'Active' },
        { rollNo: '---', name: '---', section: '-', email: '---', status: 'Inactive' },
        { rollNo: '---', name: '---', section: '-', email: '---', status: 'Active' },
    ];

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
            <Sidebar />

            <main className="flex-1 ml-64 p-8">
                {/* Page Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
                        <p className="text-gray-500 mt-2">Manage your section students and monitor their progress.</p>
                    </div>
                    <div>
                        {isUploadMode ? (
                            <button
                                onClick={() => setIsUploadMode(false)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                            >
                                <X size={18} />
                                Cancel Upload
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsUploadMode(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                            >
                                <Upload size={18} />
                                Upload Excel
                            </button>
                        )}
                    </div>
                </div>

                {/* Upload Section (Conditional) */}
                {isUploadMode && (
                    <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Bulk Upload Students</h2>

                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer group">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileSpreadsheet size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Drag and drop Excel file</h3>
                            <p className="text-sm text-gray-500 mt-2">Columns: Roll No, Name, Email</p>

                            <button className="mt-6 px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                Browse Files
                            </button>
                        </div>
                    </div>
                )}

                {/* Students List Section */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Controls */}
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or roll no..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            Total: {students.length} Students
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Roll Number</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Section</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {students.map((student, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{student.rollNo}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-900">{student.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{student.section}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Active'
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-red-50 text-red-700'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* Placeholder for actions */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentList;
