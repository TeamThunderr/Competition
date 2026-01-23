import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, ExternalLink, ArrowLeft, Globe, Clock, MessageSquare, Layers } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { getCompetitionStudents, getHODCompetitionStats } from '../../services/usersService';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
// import StudentListModal from '../../components/common/StudentListModal'; // Removed
import TotalSectionsStats from '../../components/features/competitions/stats/TotalSectionsStats';
import StudentStatsList from '../../components/features/competitions/stats/StudentStatsList';
// import SectionStudentList from '../../components/features/competitions/stats/SectionStudentList'; // Removed from here
import { UserCheck, UserPlus } from 'lucide-react';

const CompetitionDetails = () => {
    const { id } = useParams();
    // ... (rest of imports/setup)

    const navigate = useNavigate();
    const [competition, setCompetition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState({ total_sections: [], registered: [], shortlisted: [], total: [] });


    const user = getCurrentUser();
    const isFaculty = user?.role === 'FACULTY';
    const isHOD = user?.role === 'HOD';

    const handleStatsClick = (students, title, section) => {
        let finalTitle = title;
        if (section && !finalTitle.includes('Section') && !finalTitle.includes('Year')) {
            finalTitle = `${title} - Section ${section}`;
        }

        // Navigate to new page with state
        const sectionSlug = section ? section.toString().replace(/[^a-zA-Z0-9]/g, '-') : 'all';
        navigate(`/hod/competitions/${id}/section/${sectionSlug}`, {
            state: {
                students: students,
                title: finalTitle
            }
        });
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/competitions/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setCompetition(data);
                }

                if (isFaculty) {
                    const students = await getCompetitionStudents(id);
                    setStatsData(students);
                } else if (isHOD) {
                    const hodStats = await getHODCompetitionStats(id);
                    setStatsData(hodStats);
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, isFaculty, isHOD]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <RoleBasedLoader role={isHOD ? 'HOD' : isFaculty ? 'FACULTY' : 'STUDENT'} />
            </div>
        );
    }
    if (!competition) return <div className="p-8 text-center text-red-500">Competition not found</div>;

    // derived data


    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                {isFaculty ? "Back to Dashboard" : isHOD ? "Back to Department" : "Back to Dashboard"}
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full md:w-auto">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl md:text-2xl font-bold flex-shrink-0">
                            {competition.platform?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 break-words">{competition.title}</h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-3 py-1 bg-${isHOD ? 'purple' : 'green'}-100 text-${isHOD ? 'purple' : 'green'}-700 rounded-full text-xs font-semibold whitespace-nowrap`}>
                                    {isHOD ? "DEPARTMENT VIEW" : isFaculty ? "MENTOR VIEW" : "DETAILS VIEW"}
                                </span>
                                <span className="text-gray-500 text-sm flex items-center gap-1 whitespace-nowrap">
                                    <Globe size={14} />
                                    {competition.platform}
                                </span>
                            </div>
                        </div>
                    </div>

                    {competition.external_link && (
                        <a
                            href={competition.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4 md:mt-0"
                        >
                            <ExternalLink size={18} />
                            Open Website
                        </a>
                    )}
                </div>
            </div>

            {/* Content Section: Conditionally Render based on Role */}
            {isFaculty || isHOD ? (
                // FACULTY/HOD VIEW (3 Column Layout)
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Event Info (Left Side - Small) */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-1 h-fit">
                        <h2 className="font-bold text-gray-900 mb-4">Event Information</h2>

                        {/* FACULTY ACTIONS */}
                        {isFaculty && (
                            <div className="mb-6 space-y-3">
                                <button
                                    onClick={async () => {
                                        if (confirm(`Start Gmail Sync for ${competition.title}? This may take a moment.`)) {
                                            setLoading(true); // Reuse main loader or local
                                            try {
                                                await api.post(`/api/faculty/competition/${id}/sync`, {});
                                                alert("Sync Completed! Refreshing data...");
                                                // Refresh Data
                                                const students = await getCompetitionStudents(id);
                                                setStatsData(students);
                                            } catch (e) {
                                                console.error(e);
                                                alert("Sync failed: " + (e.message || "Unknown error"));
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                                >
                                    🔄 Sync Competition
                                </button>

                                <button
                                    className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                                    onClick={() => alert("Download CSV Feature Implementation needed")}
                                >
                                    📥 Download List
                                </button>
                            </div>
                        )}

                        <div className="space-y-4 text-sm mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Clock size={16} /> Registration Ends
                                </span>
                                <span className="font-medium text-gray-900">
                                    {competition.registration_deadline
                                        ? new Date(competition.registration_deadline).toLocaleDateString()
                                        : "TBA"}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Calendar size={16} /> Event Date
                                </span>
                                <span className="font-medium text-gray-900">
                                    {competition.event_date
                                        ? new Date(competition.event_date).toLocaleDateString()
                                        : "TBA"}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Users size={16} /> Team Size
                                </span>
                                <span className="font-medium text-gray-900">
                                    {competition.min_team_size} - {competition.max_team_size} Members
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <MessageSquare size={16} /> Mode
                                </span>
                                <span className="font-medium text-gray-900">
                                    {competition.mode || "Online"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Columns (Right Side - Wide) */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* HOD View: Using Modular Components */}
                        {isHOD ? (
                            <>
                                <div className="h-full">
                                    <TotalSectionsStats
                                        data={statsData.total_sections}
                                        onSectionClick={handleStatsClick}
                                    />
                                </div>
                                <div className="h-full">
                                    <StudentStatsList
                                        title="Registered"
                                        students={statsData.registered || []}
                                        onSectionClick={handleStatsClick}
                                        icon={UserPlus}
                                        colorClass="text-blue-600"
                                    />
                                </div>
                                <div className="h-full">
                                    <StudentStatsList
                                        title="Shortlisted"
                                        students={statsData.shortlisted || []}
                                        onSectionClick={handleStatsClick}
                                        icon={UserCheck}
                                        colorClass="text-green-600"
                                    />
                                </div>
                            </>
                        ) : (
                            // Faculty View (Simplified for now, reusing HOD logic components or keeping legacy?)
                            // Keeping legacy Faculty logic for "Unregistered" if needed, but previously we shared logic.
                            // The previous code had complex inline logic for 'unregistered'. Let's keep the Faculty legacy logic separate if possible or adapt.
                            // The prompt focus is HOD. I will wrap the non-HOD logic in the else block properly.

                            /* Faculty / Student View Logic re-inserted below */
                            <>
                                {/* Faculty View: Unregistered/Pending */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    {(() => {
                                        const unregisteredStudents = statsData.unregistered ||
                                            (statsData.total || []).filter(student => !statsData.registered?.some(reg => reg.id === student.id));

                                        return (
                                            <>
                                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                    Unregistered / Pending ({unregisteredStudents.length})
                                                </h3>
                                                <div className="h-96 overflow-y-auto pr-2 space-y-2">
                                                    {unregisteredStudents.length > 0 ? (
                                                        unregisteredStudents.map(student => (
                                                            <div key={student.id} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <div className="font-medium text-gray-900">{student.name}</div>
                                                                <div className="text-xs text-gray-500">{student.regNo}</div>
                                                                {student.status && student.status !== 'NOT_REGISTERED' && (
                                                                    <div className="mt-1 text-[10px] text-gray-500">
                                                                        Status: {student.status}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-sm text-gray-400 text-center py-4">All students registered!</div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Faculty View: Registered */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Registered ({statsData.registered?.length || 0})
                                    </h3>
                                    <div className="h-96 overflow-y-auto pr-2 space-y-2">
                                        {statsData.registered?.length > 0 ? (
                                            statsData.registered.map(student => (
                                                <div key={student.id} className={`text-sm p-3 rounded-lg border ${student.confidence > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="font-medium text-gray-900">{student.name}</div>
                                                    <div className="flex justify-between items-center mt-1 flex-wrap gap-1">
                                                        <span className="text-xs text-blue-600">{student.regNo}</span>
                                                        {student.verified ? (
                                                            <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded border border-green-200">Manual Verified</span>
                                                        ) : (student.confidence > 0 ? (
                                                            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">Auto-Detected ({student.confidence}%)</span>
                                                        ) : (
                                                            <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200">Pending</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : <div className="text-sm text-gray-400 text-center py-4">No registrations yet</div>}
                                    </div>
                                </div>

                                {/* Faculty View: Shortlisted */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        Shortlisted ({statsData.shortlisted?.length || 0})
                                    </h3>
                                    <div className="h-96 overflow-y-auto pr-2 space-y-2">
                                        {statsData.shortlisted?.length > 0 ? (
                                            statsData.shortlisted.map(student => (
                                                <div key={student.id} className="text-sm p-3 bg-purple-50 rounded-lg border border-purple-100">
                                                    <div className="font-medium text-gray-900">{student.name}</div>
                                                    <div className="text-xs text-purple-600">{student.regNo} {student.section && `(${student.section})`}</div>
                                                </div>
                                            ))
                                        ) : <div className="text-sm text-gray-400 text-center py-4">No shortlisted students</div>}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>




                </div>
            ) : (
                // STUDENT VIEW (Standard One with About & Timeline)
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Description & Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        {competition.description && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">About this Event</h2>
                                <div className="prose text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {competition.description}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Key Info (Same as before) */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="font-bold text-gray-900 mb-4">Event Information</h2>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Clock size={16} /> Registration Ends
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {competition.registration_deadline
                                            ? new Date(competition.registration_deadline).toLocaleDateString()
                                            : "TBA"}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Calendar size={16} /> Event Date
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {competition.event_date
                                            ? new Date(competition.event_date).toLocaleDateString()
                                            : "TBA"}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Users size={16} /> Team Size
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {competition.min_team_size} - {competition.max_team_size} Members
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <MessageSquare size={16} /> Mode
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {competition.mode || "Online"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default CompetitionDetails;
