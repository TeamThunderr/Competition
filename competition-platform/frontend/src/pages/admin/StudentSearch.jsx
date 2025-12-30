import React from 'react';
import Sidebar from './Sidebar';
import { Search } from 'lucide-react';
import { api } from '../../services/api';

const StudentSearch = () => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [students, setStudents] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchStudents = async () => {
            try {
                // Attempt to fetch students from admin endpoint
                // Note: Endpoint might need adjustment based on backend actuals
                const response = await api.get('/api/admin/students');
                if (response?.data) {
                    const mappedStudents = response.data.map(user => ({
                        id: user.id,
                        name: user.full_name,
                        roll_number: user.registration_no,
                        department: user.departments?.name || 'Unknown',
                        year: user.year || 'N/A',
                        email: user.email || 'N/A',
                        section: user.section,
                        cgpa: user.cgpa || 'N/A',
                        attendance: user.attendance ? `${user.attendance}%` : '0%',
                        pending_verifications: 0,
                        achievements: 0,
                    }));
                    setStudents(mappedStudents);
                }
            } catch (err) {
                console.error("Failed to fetch students:", err);
                setError("Failed to load student directory. Please try again later.");
                // Fallback mock data if API fails to avoid empty screen during dev
                const mockStudents = Array.from({ length: 100 }, (_, i) => ({
                    id: i + 1,
                    name: `Student ${i + 1}`,
                    roll_number: `21IT${(i + 1).toString().padStart(3, '0')}`,
                    department: ["IT", "CSE", "ECE", "MECH"][i % 4],
                    year: "3",
                    email: `student${i + 1}@cit.edu`
                }));
                setStudents(mockStudents);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [selectedStudent, setSelectedStudent] = React.useState(null);

    // Mock extra details for the modal since API mainly gives basic directory info
    const getStudentDetails = (student) => ({
        ...student,
        achievements: 4, // Still mocked as requested
        pending_verifications: 0 // Still mocked
    });

    const handleViewProfile = (student) => {
        setSelectedStudent(getStudentDetails(student));
    };

    const closeModal = () => setSelectedStudent(null);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Student Search</h1>
                    <p className="text-gray-500 mt-1">Global directory lookup. View history and activity for any student.</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[600px]">
                    <div className="relative max-w-2xl mb-8">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Search by Name or Roll Number"
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading directory...</div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">{error}</div>
                    ) : !searchTerm ? (
                        <div className="text-center py-20">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Search for a student</h3>
                            <p className="text-gray-500 mt-1">Enter a name or roll number to view their details.</p>
                        </div>
                    ) : filteredStudents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                <div className="text-xs text-gray-500">{student.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.roll_number}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.year}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleViewProfile(student)}
                                                    className="text-blue-600 hover:text-blue-900 font-semibold"
                                                >
                                                    View Profile
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No students found matching "{searchTerm}"
                        </div>
                    )}
                </div>
            </div>

            {/* Student Details Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="bg-blue-600 p-6 text-white relative">
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 text-white hover:bg-blue-700 rounded-full p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                                    {selectedStudent.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                                    <p className="text-blue-100">{selectedStudent.roll_number}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
                                    <p className="text-gray-900 font-medium">{selectedStudent.department}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Year</label>
                                    <p className="text-gray-900 font-medium">{selectedStudent.year}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                                    <p className="text-gray-900 font-medium">{selectedStudent.email}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">CGPA (Avg)</label>
                                    <p className="text-gray-900 font-medium">{selectedStudent.cgpa}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Competition Stats</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{selectedStudent.achievements}</div>
                                        <div className="text-xs text-blue-600 font-medium">Competitions Won</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{selectedStudent.attendance}</div>
                                        <div className="text-xs text-green-600 font-medium">Participation Rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentSearch;
