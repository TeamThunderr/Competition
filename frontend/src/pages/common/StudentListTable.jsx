import React, { useState } from 'react';
import { Search, User } from 'lucide-react';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

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
 * @param {String} role - 'STUDENT', 'FACULTY', 'HOD' for customized loader
 */
// Force update
const StudentListTable = ({
    students = [],
    loading = false,
    onRowClick,
    emptyMessage = "No students found.",
    role = 'STUDENT',
    showSection = true
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = (students || []).filter(student => {
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
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Controls */}
            <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, roll no, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-muted/5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-foreground placeholder-muted"
                    />
                </div>
                <div className="text-sm text-muted font-medium ml-4 whitespace-nowrap">
                    Total: {sortedStudents.length} Students
                </div>
            </div>

            {/* Table / List View */}
            <div className="min-h-[400px] overflow-x-auto">
                {/* Desktop Table View */}
                <table className="w-full hidden md:table">
                    <thead className="bg-muted/5">
                        <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wider">
                            <th className="px-6 py-4 w-12">S.No</th>
                            <th className="px-6 py-4">Register No</th>
                            <th className="px-6 py-4">Name</th>
                            {showSection && <th className="px-6 py-4">Section</th>}
                            <th className="px-6 py-4">Email</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {loading ? (
                            <tr>
                                <td colSpan={showSection ? 5 : 4} className="px-6 py-12">
                                    <RoleBasedLoader role={role} />
                                </td>
                            </tr>
                        ) : sortedStudents.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-muted">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            sortedStudents.map((student, index) => (
                                <tr
                                    key={student.id || index}
                                    onClick={() => onRowClick && onRowClick(student)}
                                    className={`hover:bg-muted/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                >
                                    <td className="px-6 py-4 text-sm text-muted font-medium whitespace-nowrap">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-foreground font-medium whitespace-nowrap">
                                        {student.rollNo || student.regNo || student.reg || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs">
                                                {student.name ? student.name.charAt(0).toUpperCase() : <User size={14} />}
                                            </div>
                                            <span className="font-semibold text-foreground text-sm">{student.name}</span>
                                        </div>
                                    </td>
                                    {showSection && (
                                        <td className="px-6 py-4 text-sm text-muted">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/10 text-foreground">
                                                {student.section}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-sm text-muted">{student.email}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col divide-y divide-border">
                    {loading ? (
                        <div className="p-12">
                            <RoleBasedLoader role={role} />
                        </div>
                    ) : sortedStudents.length === 0 ? (
                        <div className="p-12 text-center text-muted">
                            {emptyMessage}
                        </div>
                    ) : (
                        sortedStudents.map((student, index) => (
                            <div 
                                key={student.id || index}
                                onClick={() => onRowClick && onRowClick(student)}
                                className={`p-4 hover:bg-muted/5 transition-colors flex items-center gap-4 ${onRowClick ? 'cursor-pointer active:bg-muted/10' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm flex-shrink-0">
                                    {student.name ? student.name.charAt(0).toUpperCase() : <User size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-foreground text-sm truncate">{student.name}</div>
                                    <div className="text-xs text-muted truncate mt-0.5">{student.rollNo || student.regNo || student.reg || '-'}</div>
                                    <div className="text-xs text-muted truncate mt-0.5 opacity-70">{student.email}</div>
                                </div>
                                {showSection && (
                                    <div className="flex-shrink-0 text-xs font-medium bg-muted/10 text-foreground px-2 py-1 rounded-md">
                                        Sec {student.section}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentListTable;
