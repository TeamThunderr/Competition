import React, { useState } from 'react';
import { ArrowLeft, Search, User, Clock, FileCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SectionStudentList = ({ title, students, onClose }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.regNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!students) return null;

    // Helper for Status Badge
    const getStatusBadge = (student) => {
        if (student.status && student.status !== 'NOT_REGISTERED') {
            // Example statuses: 'SHORTLISTED', 'REJECTED'
            const isPositive = ['SHORTLISTED', 'ACCEPTED', 'WINNER'].includes(student.status);
            const isNegative = ['REJECTED', 'DISQUALIFIED'].includes(student.status);
            return (
                <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isPositive ? 'bg-green-100 text-green-700 border-green-200' :
                    isNegative ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                    {student.status}
                </span>
            );
        }
        if (student.verified) {
            return <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide">Verified</span>;
        }
        if (student.confidence > 0) {
            return <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wide">Auto ({student.confidence}%)</span>;
        }
        return <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 uppercase tracking-wide">Pending</span>;
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* List Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-white gap-4">
                <h3 className="font-semibold text-gray-800">Total Students: {students.length}</h3>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or reg no..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                    />
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-0">
                {filteredStudents.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {filteredStudents.map((student, index) => (
                            <div
                                key={student.id}
                                onClick={() => navigate(`/hod/students/${student.id}`)}
                                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon/Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <div className="flex items-center">
                                            <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                                                {student.name}
                                            </h4>
                                            {getStatusBadge(student)}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            <span className="font-medium text-gray-600">Reg: {student.regNo}</span>
                                            <span>•</span>
                                            <span>Sec {student.section || 'N/A'}</span>
                                            <span>•</span>
                                            <span className="text-gray-400">Click to view profile</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side (Optional: More Info or Action) */}
                                <div className="hidden md:block text-right">
                                    {student.uploaded_at && (
                                        <div className="text-xs text-gray-400 mb-1">
                                            {new Date(student.uploaded_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Search className="w-12 h-12 mb-3 opacity-20" />
                        <p>No students match your search</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SectionStudentList;
