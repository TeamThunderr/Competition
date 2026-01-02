import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, X, Mail, Phone, Clock, Trophy, Award } from 'lucide-react';
import { getStudents, getStudentById } from '../../services/usersService';

const StudentSearch = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    // Initialize from URL param 'q' or empty string
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            // Update URL query param to persist search state
            if (searchTerm.trim() !== '') {
                setSearchParams({ q: searchTerm });
                handleSearch();
            } else {
                setSearchParams({});
                setStudents([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const navigate = useNavigate();

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

    const handleStudentClick = (studentId) => {
        navigate(`/admin/student/${studentId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="mb-8 text-center pt-8">
                    <h1 className="text-2xl font-bold text-gray-900">Student Search</h1>
                    <p className="text-gray-500 mt-1">Global directory lookup. View history and activity for any student.</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[600px]">
                    {/* Search Bar */}
                    <div className="relative max-w-2xl mb-8 mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}

                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Search by Name, Roll Number or Email..."
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
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((student) => (
                                        <tr
                                            key={student.id}
                                            onClick={() => handleStudentClick(student.id)}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
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
        </div>
    );
};

export default StudentSearch;
