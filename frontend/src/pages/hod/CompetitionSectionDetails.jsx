import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import SectionStudentList from '../../components/features/competitions/stats/SectionStudentList';
import { getHODCompetitionStats } from '../../services/hodService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import HodLayout from './HodLayout';
import { ArrowLeft } from 'lucide-react';

const CompetitionSectionDetails = () => {
    const { id, sectionName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Use passed state if available, otherwise fetch
    const [students, setStudents] = useState(location.state?.students || null);
    const [loading, setLoading] = useState(!location.state?.students);
    const [title, setTitle] = useState(location.state?.title || `Section ${sectionName}`);

    useEffect(() => {
        if (!students) {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const stats = await getHODCompetitionStats(id);

                    // Logic to find the section students from stats
                    // We need to look in total_sections, registered, shortlisted to find matches?
                    // Or we just re-derive?
                    // The backend doesn't return "sections" array directly with students for ALL types at once easily in the raw response?
                    // Actually getHODCompetitionStats returns { total_sections: [...], registered: [...], shortlisted: [...] }

                    // We need to know WHICH list we are looking at (Registered vs Shortlisted vs Total).
                    // The URL params might need to include the "type" (e.g. 'registered', 'shortlisted', 'total').
                    // For now, let's assume sectionName is unique enough or we infer.
                    // But wait, "Section A" exists in "Registered" AND "Shortlisted".

                    // The previous flow passed the Specific List of students.
                    // If we refresh, we lose that context of "Which Category" (Registered vs Shortlisted) unless we put it in the URL.

                    // Let's assume for resilience, if we refresh, we might not be able to perfectly reconstruct without a "type" param.
                    // Let's add 'type' to the route: /hod/competitions/:id/section/:type/:sectionName

                } catch (err) {
                    console.error("Failed to fetch section data", err);
                } finally {
                    setLoading(false);
                }
            };
            // If we don't have data, we might just redirect back because complex reconstruction is risky without more params.
            // But let's try to just render loading if waiting, or empty.
            // Actually, for better UX, let's just rely on navigation state for now as it's an internal drilldown.
            // If user refreshes, we can redirect back to competition details.
            navigate(`/competitions/${id}`, { replace: true });
        }
    }, [id, students, navigate]);

    if (loading) return <RoleBasedLoader role="HOD" />;

    // Redirect if no students data found (and not loading)
    if (!students) return null;

    return (
        <>
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-muted hover:text-blue-600 transition-colors font-medium mb-2"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Competition
                </button>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                <p className="text-muted">View and manage students in this section.</p>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-[500px]">
                <SectionStudentList
                    students={students}
                // title and onClose are handled by the parent page layout now
                />
            </div>
        </>
    );
};

export default CompetitionSectionDetails;
