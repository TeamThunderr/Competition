import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getStudentDetails } from '../../services/facultyService';
import StudentProfileView from '../common/StudentProfileView';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const StudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getStudentDetails(id);
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
            <div className="flex bg-background min-h-screen items-center justify-center">
                <RoleBasedLoader role="FACULTY" />
            </div>
        );
    }

    if (error) {
        return (
            <>
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                    <button
                        onClick={() => navigate('/faculty/students')}
                        className="mt-4 flex items-center gap-2 text-muted hover:text-foreground"
                    >
                        <ArrowLeft size={20} /> Back to List
                    </button>
            </>
        );
    }

    return (
        <>
                {/* Header with Back Button */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/faculty/students')}
                        className="flex items-center gap-2 text-muted hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} /> Back to Student List
                    </button>
                </div>

                {/* Shared Profile View */}
                <StudentProfileView student={student} />
        </>
    );
};

export default StudentDetail;
