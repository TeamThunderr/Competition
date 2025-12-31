import React, { useState } from 'react';
import { Search, Loader, User } from 'lucide-react';

/**
 * StudentListTable Component
 * 
 * A reusable table component for displaying students.
 * Features:
 * - Search bar (Name/Reg No)
 * - Sorting (Name)
 * - Clickable rows
 * - Empty & Loading states
 * 
 * @param {Array} students - Array of student objects { id, regNo|rollNo, name, section, email, icon? }
 * @param {Boolean} loading - Loading state
 * @param {Function} onRowClick - Callback (student) => {}
 * @param {String} emptyMessage - Message to show when no students found
 */
const StudentListTable = ({
    students = [],
    loading = false,
    onRowClick,
    emptyMessage = "No students found."
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = students.filter(student => {
        const term = searchTerm.toLowerCase();
        const name = (student.name || '').toLowerCase();
        // Handle both regNo (HOD) and rollNo (Faculty) keys
        const reg = (student.rollNo || student.regNo || student.reg || '').toLowerCase();
        const email = (student.email || '').toLowerCase();

        return name.includes(term) || reg.includes(term) || email.includes(term);
    });

    const sortedStudents = [...filteredStudents].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })
    );

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Controls */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, roll no, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700"
                    />
                </div>
                <div className="text-sm text-gray-500 font-medium ml-4 whitespace-nowrap">
                    Total: {sortedStudents.length} Students
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50/50">
                        <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-4 w-12">S.No</th>
                            <th className="px-6 py-4">Register No</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Section</th>
                            <th className="px-6 py-4">Email</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Loader className="animate-spin mb-2" size={24} />
                                        <p>Loading students...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : sortedStudents.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            sortedStudents.map((student, index) => (
                                <tr
                                    key={student.id || index}
                                    onClick={() => onRowClick && onRowClick(student)}
                                    className={`hover:bg-gray-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                >
                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium whitespace-nowrap">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                                        {student.rollNo || student.regNo || student.reg || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {student.name ? student.name.charAt(0).toUpperCase() : <User size={14} />}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {student.section}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentListTable;
