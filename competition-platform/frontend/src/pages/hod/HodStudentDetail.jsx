import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HodLayout from './HodLayout';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getHodStudentDetails } from '../../services/usersService';
import StudentProfileView from '../common/StudentProfileView';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const HodStudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getHodStudentDetails(id);
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
            <div className="flex bg-gray-50 min-h-screen items-center justify-center">
                <RoleBasedLoader role="HOD" />
            </div>
        );
    }

    if (error) {
        return (
            <HodLayout>
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
                <button
                    onClick={() => navigate('/hod')}
                    className="mt-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
            </HodLayout>
        );
    }

    if (!student) return null;

    return (
        <HodLayout>
            {/* Header with Back Button */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/hod')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                {/* HOD Specific Filter/Context if needed in future */}
            </div>

            {/* Shared Profile View */}
            <StudentProfileView student={student} />
        </HodLayout>
    );
};

export default HodStudentDetail;
