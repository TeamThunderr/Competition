import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, ExternalLink, ArrowLeft, Globe, Clock, MessageSquare, Layers } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { getCompetitionStudents } from '../../services/facultyService';
import { getHODCompetitionStats } from '../../services/hodService';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const CompetitionDetails = () => {
    const { id } = useParams();
    // ... (rest of imports/setup)

    // ...

    const navigate = useNavigate();
    const [competition, setCompetition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState({ total_sections: [], registered: [], shortlisted: [], winners: [], total: [] });
    const user = getCurrentUser();
    const isFaculty = user?.role === 'FACULTY';
    const isHOD = user?.role === 'HOD';

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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex flex-col gap-6">
                    {/* Top Row: Icon, Title, Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl font-bold flex-shrink-0">
                                {competition.platform?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">{competition.title}</h1>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`px-3 py-1 bg-${isHOD ? 'purple' : 'green'}-100 text-${isHOD ? 'purple' : 'green'}-700 rounded-full text-xs font-semibold whitespace-nowrap`}>
                                        {isHOD ? "DEPARTMENT VIEW" : isFaculty ? "MENTOR VIEW" : "DETAILS VIEW"}
                                    </span>
                                    <span className="text-gray-500 text-sm flex items-center gap-1">
                                        <Globe size={14} />
                                        {competition.platform}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            {/* Faculty Sync Button - Moved to Header */}
                            {isFaculty && (
                                <button
                                    onClick={async () => {
                                        if (confirm(`Start Gmail Sync for ${competition.title}? This may take a moment.`)) {
                                            setLoading(true);
                                            try {
                                                await api.post(`/api/faculty/competition/${id}/sync`, {});
                                                alert("Sync Completed! Refreshing data...");
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
                                    className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                                >
                                    🔄 Sync
                                </button>
                            )}

                            {competition.external_link && (
                                <a
                                    href={competition.external_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                                >
                                    <ExternalLink size={16} />
                                    Open Website
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Integrated Event Info Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-100 mt-2">
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                                <Clock size={12} /> Registration Ends
                            </span>
                            <span className="font-medium text-gray-900 text-sm">
                                {competition.registration_deadline ? new Date(competition.registration_deadline).toLocaleDateString() : "TBA"}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                                <Calendar size={12} /> Event Date
                            </span>
                            <span className="font-medium text-gray-900 text-sm">
                                {competition.event_date ? new Date(competition.event_date).toLocaleDateString() : "TBA"}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                                <Users size={12} /> Team Size
                            </span>
                            <span className="font-medium text-gray-900 text-sm">
                                {competition.min_team_size} - {competition.max_team_size} Members
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                                <MessageSquare size={12} /> Mode
                            </span>
                            <span className="font-medium text-gray-900 text-sm">
                                {competition.mode || "Online"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section: Conditionally Render based on Role */}
            {isFaculty || isHOD ? (
                // FACULTY/HOD VIEW (Full Width Grid)
                <div className="w-full">
                    {/* Stats Columns - Full Width */}

                    {/* Stats Columns (Right Side - Wide) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Column 1: Custom Logic for Unregistered */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                            {(() => {
                                // Use backend 'unregistered' list if available, else derive
                                const unregisteredStudents = isHOD ? [] : (
                                    statsData.unregistered ||
                                    (statsData.total || []).filter(student => !statsData.registered?.some(reg => reg.id === student.id))
                                );

                                return (
                                    <>
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 truncate">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                                            <span className="truncate" title={isHOD ? `Total Sections In Dept` : `Unregistered / Pending`}>
                                                {isHOD ? `Total Sections In Dept` : `Unregistered / Pending (${unregisteredStudents.length})`}
                                            </span>
                                        </h3>
                                        <div className="h-96 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                            {isHOD ? (
                                                /* HOD View Logic (Kept Same) */
                                                statsData.total_sections?.length > 0 ? (
                                                    statsData.total_sections.map((group, gIdx) => (
                                                        <div key={gIdx} className="mb-3">
                                                            <details className="group" open={group.year === '2nd Year' || group.year === '3rd Year'}>
                                                                <summary className="flex justify-between items-center font-bold text-gray-700 cursor-pointer p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                                                    <span>{group.year}</span>
                                                                    <span className="text-xs bg-white px-2 py-0.5 rounded text-gray-500 shadow-sm border border-gray-200">
                                                                        {group.totalStudents} Students
                                                                    </span>
                                                                </summary>
                                                                <div className="mt-2 pl-2 space-y-2 border-l-2 border-gray-100 ml-2">
                                                                    {group.sections.map((sec, sIdx) => (
                                                                        <div key={sIdx} className="flex justify-between items-center text-sm p-2 bg-white border border-gray-100 rounded-md shadow-sm">
                                                                            <div className="font-medium text-gray-900 flex items-center gap-2 truncate">
                                                                                <Layers size={14} className="text-gray-400 flex-shrink-0" />
                                                                                <span className="truncate">Section {sec.name}</span>
                                                                            </div>
                                                                            <div className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded font-medium border border-gray-100 whitespace-nowrap">
                                                                                {sec.count} Students
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </details>
                                                        </div>
                                                    ))
                                                ) : <div className="text-sm text-gray-400 text-center py-4">No sections found</div>
                                            ) : (
                                                // Faculty: List Unregistered Students
                                                unregisteredStudents.length > 0 ? (
                                                    unregisteredStudents.map(student => (
                                                        <div key={student.id} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                            <div className="font-medium text-gray-900">{student.name}</div>
                                                            <div className="text-xs text-gray-500">{student.regNo}</div>
                                                            {/* Show Status if available (Pending, Rejected) */}
                                                            {student.status && student.status !== 'NOT_REGISTERED' && (
                                                                <div className="mt-1 text-[10px] text-gray-500">
                                                                    Status: {student.status}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-sm text-gray-400 text-center py-4">All students registered!</div>
                                                )
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Column 2: Registered Students */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <span className="truncate">Registered ({statsData.registered?.length || 0})</span>
                            </h3>
                            <div className="h-96 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                {statsData.registered?.map(student => (
                                    <div key={student.id} className={`text-sm p-3 rounded-lg border ${student.confidence > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="font-medium text-gray-900 truncate">{student.name}</div>
                                        <div className="flex justify-between items-center mt-1 flex-wrap gap-1">
                                            <span className="text-xs text-blue-600 truncate">{student.regNo}</span>

                                            {student.verified ? (
                                                <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded border border-green-200">
                                                    Manual Verified
                                                </span>
                                            ) : (student.confidence > 0 ? (
                                                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200" title={`Confidence: ${student.confidence}%`}>
                                                    Auto-Detected ({student.confidence}%)
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200">
                                                    Pending
                                                </span>
                                            ))}
                                        </div>
                                        {student.remarks && <div className="text-[10px] text-gray-400 mt-1 italic">{student.remarks}</div>}
                                    </div>
                                ))}
                                {(!statsData.registered || statsData.registered.length === 0) && <div className="text-sm text-gray-400 text-center py-4">No registrations yet</div>}
                            </div>
                        </div>

                        {/* Column 3: Shortlisted Students */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                                <span className="truncate">Shortlisted ({statsData.shortlisted?.length || 0})</span>
                            </h3>
                            <div className="h-96 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                {statsData.shortlisted?.map(student => (
                                    <div key={student.id} className="text-sm p-3 bg-purple-50 rounded-lg border border-purple-100">
                                        <div className="font-medium text-gray-900 truncate">{student.name}</div>
                                        <div className="text-xs text-purple-600 truncate">{student.regNo} {student.section && `(${student.section})`}</div>
                                    </div>
                                ))}
                                {(!statsData.shortlisted || statsData.shortlisted.length === 0) && <div className="text-sm text-gray-400 text-center py-4">No shortlisted students</div>}
                            </div>
                        </div>

                        {/* Column 4: Winners */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                <span className="truncate">Winners ({statsData.winners?.length || 0})</span>
                            </h3>
                            <div className="h-96 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                {statsData.winners?.map(student => (
                                    <div key={student.id} className="text-sm p-3 bg-green-50 rounded-lg border border-green-100">
                                        <div className="font-medium text-gray-900 truncate">{student.name}</div>
                                        <div className="text-xs text-green-600 truncate">{student.regNo} {student.section && `(${student.section})`}</div>
                                    </div>
                                ))}
                                {(!statsData.winners || statsData.winners.length === 0) && <div className="text-sm text-gray-400 text-center py-4">No winners yet</div>}
                            </div>
                        </div>
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
            )}
        </div>
    );
};

export default CompetitionDetails;
