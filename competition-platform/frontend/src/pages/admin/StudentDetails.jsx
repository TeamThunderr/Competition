import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getStudentById } from '../../services/usersService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import StudentProfileView from '../common/StudentProfileView';

const StudentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const backPath = location.state?.from || '/admin/search';
    const backLabel = location.state?.from ? 'Back' : 'Back to Search';

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Using Admin service to get details (backend now returns rich data matching Faculty view)
                const data = await getStudentById(id);
                setStudent(data);
            } catch (err) {
                console.error("Failed to fetch student details", err);
                const msg = err.response?.data?.message || err.message || "Failed to load student details.";
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <RoleBasedLoader role="ADMIN" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar />
                <main className="flex-1 md:ml-64 p-8 pt-16 md:pt-8 w-full">
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                    <button
                        onClick={() => navigate(backPath)}
                        className="mt-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} /> {backLabel}
                    </button>
                </main>
            </div>
        );
    }

    if (!student) return null;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8 w-full min-w-0">
                <div className="w-[95%] mx-auto">
                    {/* Header with Back Button */}
                    <div className="mb-6">
                        <button
                            onClick={() => navigate(backPath)}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                        >
                            <ArrowLeft size={18} /> {backLabel}
                        </button>
                    </div>

                    {/* Shared Profile View */}
                    <StudentProfileView student={student} />
                </div>
            </main>
        </div>
    );
};

export default StudentDetails;
