import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Search, X, Mail, Phone, Clock, Trophy, Award } from 'lucide-react';
import { getStudents, getStudentById } from '../../services/usersService';

const StudentSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.trim() !== '') {
                handleSearch();
            } else {
                setStudents([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const results = await getStudents({ search: searchTerm });
            setStudents(results || []);
        } catch (error) {
            console.error("Search failed", error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStudentClick = async (studentId) => {
        setLoadingDetails(true);
        setSelectedStudent(null);
        try {
            const details = await getStudentById(studentId);
            setSelectedStudent(details);
        } catch (error) {
            console.error("Failed to fetch details", error);
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Student Search</h1>
                    <p className="text-gray-500 mt-1">Global directory lookup. View history and activity for any student.</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[600px]">
                    {/* Search Bar */}
                    <div className="relative max-w-2xl mb-8">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Search by Name or Roll Number..."
                        />
                    </div>

                    {/* Results Table */}
                    <div className="overflow-hidden">
                        {loading ? (
                            <div className="text-center py-10 text-gray-500">Searching...</div>
                        ) : students.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg No</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                                        {student.full_name?.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.registration_no}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.departments?.name || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{student.section || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleStudentClick(student.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : searchTerm ? (
                            <div className="text-center py-10 text-gray-500">No students found matching "{searchTerm}"</div>
                        ) : (
                            <div className="text-center py-10 text-gray-400">Start typing to search for students</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Student Details Modal */}
            {(selectedStudent || loadingDetails) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {loadingDetails ? (
                            <div className="p-8 text-center text-gray-500">Loading details...</div>
                        ) : selectedStudent && (
                            <>
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
                                    <button
                                        onClick={() => setSelectedStudent(null)}
                                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                                            {selectedStudent.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{selectedStudent.full_name}</h2>
                                            <p className="text-blue-100 text-sm">{selectedStudent.registration_no}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Department</div>
                                            <div className="font-medium text-gray-900">{selectedStudent.departments?.name || 'N/A'}</div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Section</div>
                                            <div className="font-medium text-gray-900">{selectedStudent.section || 'N/A'}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Award size={16} className="text-blue-600" />
                                                <div className="text-xs text-blue-600 uppercase font-bold">Participated</div>
                                            </div>
                                            <div className="font-bold text-2xl text-blue-900">{selectedStudent.stats?.participated || 0}</div>
                                            <div className="text-xs text-blue-400 font-medium">Competitions</div>
                                        </div>
                                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Trophy size={16} className="text-amber-600" />
                                                <div className="text-xs text-amber-600 uppercase font-bold">Won</div>
                                            </div>
                                            <div className="font-bold text-2xl text-amber-900">{selectedStudent.stats?.won || 0}</div>
                                            <div className="text-xs text-amber-400 font-medium">Victories</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Mail size={18} className="text-gray-400" />
                                            <span>{selectedStudent.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Phone size={18} className="text-gray-400" />
                                            <span>{selectedStudent.phone_number || 'No phone provided'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Clock size={18} className="text-gray-400" />
                                            <span>Current Year: {selectedStudent.current_year || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentSearch;
