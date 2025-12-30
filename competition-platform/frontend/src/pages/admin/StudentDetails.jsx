import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ArrowLeft, Mail, Phone, Clock, Trophy, Award, MapPin, Calendar, BookOpen } from 'lucide-react';
import { getStudentById } from '../../services/usersService';

const StudentDetails = () => {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                const data = await getStudentById(id);
                setStudent(data);
            } catch (err) {
                console.error("Failed to fetch student details", err);
                setError("Failed to load student details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchStudentDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <div className="flex-1 ml-64 p-8 flex items-center justify-center">
                    <div className="text-gray-500">Loading student profile...</div>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <div className="flex-1 ml-64 p-8 flex flex-col items-center justify-center">
                    <div className="text-red-500 mb-4">{error || "Student not found"}</div>
                    <Link to="/admin/search" className="text-blue-600 hover:underline">Return to Search</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8 font-sans">
                {/* Header */}
                <div className="mb-8 relative">
                    <Link to="/admin/search" className="absolute left-0 top-0 inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Search
                    </Link>
                    <div className="text-center pt-8">
                        <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
                        <p className="text-gray-500 mt-1">Detailed academic and participation record.</p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/30 shadow-inner">
                                {student.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold mb-1">{student.full_name}</h2>
                                <p className="text-blue-100 text-lg font-mono">{student.registration_no}</p>
                                <div className="flex items-center gap-4 mt-4 text-sm text-blue-50">
                                    <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                                        <Mail size={14} /> {student.email}
                                    </span>
                                    {student.phone_number && (
                                        <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                                            <Phone size={14} /> {student.phone_number}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Academic Info */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Academic Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Department</p>
                                            <p className="font-medium text-gray-900">{student.departments?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Section</p>
                                            <p className="font-medium text-gray-900">{student.section || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Admission Year</p>
                                            <p className="font-medium text-gray-900">{student.admission_year || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Stats */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Performance Metrics</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                                        <div className="text-3xl font-bold text-gray-900 mb-1">{student.cgpa || 'N/A'}</div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase">CGPA</div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                                        <div className="text-3xl font-bold text-gray-900 mb-1">{student.attendance ? `${student.attendance}%` : 'N/A'}</div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase">Attendance</div>
                                    </div>
                                </div>
                            </div>

                            {/* Achievements */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Competition Stats</h3>
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-4 border border-blue-100">
                                        <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm">
                                            <Award size={24} />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-blue-900">{student.stats?.participated || 0}</div>
                                            <div className="text-xs text-blue-600 font-bold uppercase">Participations</div>
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-xl flex items-center gap-4 border border-amber-100">
                                        <div className="p-3 bg-white rounded-full text-amber-600 shadow-sm">
                                            <Trophy size={24} />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-amber-900">{student.stats?.won || 0}</div>
                                            <div className="text-xs text-amber-600 font-bold uppercase">Victories</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Start - Helper Icon Component (Users is used but not imported in the top list above correctly, fixing import)
function Users({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
    );
}
// End - Helper Icon Component

export default StudentDetails;
