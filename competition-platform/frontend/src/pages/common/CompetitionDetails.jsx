import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, ExternalLink, ArrowLeft, Globe, Clock, MessageSquare, Layers } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { getCompetitionStudents } from '../../services/facultyService';
import { getHODCompetitionStats } from '../../services/hodService';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
// import StudentListModal from '../../components/common/StudentListModal'; // Removed -> Uncommented below
import StudentListModal from '../../components/common/StudentListModal';
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
    const [statsData, setStatsData] = useState({ total_sections: [], registered: [], shortlisted: [], winners: [], total: [] });
    // NEW: Year Filter State - Default to 2nd Year
    const [selectedYear, setSelectedYear] = useState('2nd Year');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);

    const user = getCurrentUser();
    const isFaculty = user?.role === 'FACULTY';
    const isHOD = user?.role === 'HOD';

    // Helper to filter sections by year
    const filterByYear = (sections) => {
        if (!sections) return [];
        return sections.filter(group => group.year === selectedYear);
    };

    // Derived Data: Unregistered Students (Moved to top level)
    const unregisteredSections = useMemo(() => {
        // If data is missing (e.g. loading), return empty. But hook MUST run.
        if (!statsData.total_sections || !statsData.registered) return [];

        const registeredRegNos = new Set(statsData.registered.map(r => r.regNo));

        return statsData.total_sections.map(group => ({
            ...group,
            sections: group.sections.map(sec => {
                // Filter out students who are in the registered list
                const unregisteredStudents = sec.students ? sec.students.filter(s => !registeredRegNos.has(s.regNo)) : [];
                return {
                    ...sec,
                    students: unregisteredStudents,
                    count: unregisteredStudents.length
                };
            }),
            // Recalculate total students for the group
            totalStudents: 0
        })).map(group => ({
            ...group,
            totalStudents: group.sections.reduce((sum, sec) => sum + sec.count, 0)
        }));
    }, [statsData.total_sections, statsData.registered]);

    const totalUnregisteredCount = useMemo(() => {
        // Faculty view: uses flat unregistered array
        if (isFaculty && statsData.unregistered) {
            return statsData.unregistered.length;
        }
        // HOD view: uses grouped sections
        return unregisteredSections.reduce((sum, group) => sum + group.totalStudents, 0);
    }, [unregisteredSections, statsData.unregistered, isFaculty]);

    const handleSectionClick = (students, year, sectionName, type = 'Total') => {
        const title = `${year} - Section ${sectionName} (${type})`;
        const sectionSlug = sectionName ? sectionName.toString().replace(/[^a-zA-Z0-9]/g, '-') : 'all';
        navigate(`/hod/competitions/${id}/section/${sectionSlug}`, {
            state: {
                students: students,
                title: title
            }
        });
    };

    // ... existing handleStatsClick and useEffect ... 

    // ... inside return ...



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
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/competitions/${id}`);
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

                            {isFaculty && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const { downloadCompetitionReport } = await import('../../services/facultyService');
                                                await downloadCompetitionReport(id, competition.title, 'registered');
                                            } catch (e) {
                                                alert("Download failed: " + e.message);
                                            }
                                        }}
                                        className="bg-white border border-gray-300 text-green-700 px-3 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                                        title="Download Registered Students"
                                    >
                                        📥 Registered
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const { downloadCompetitionReport } = await import('../../services/facultyService');
                                                await downloadCompetitionReport(id, competition.title, 'unregistered');
                                            } catch (e) {
                                                alert("Download failed: " + e.message);
                                            }
                                        }}
                                        className="bg-white border border-gray-300 text-red-700 px-3 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                                        title="Download Unregistered Students"
                                    >
                                        📥 Unregistered
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Integrated Event Info Bar - REMOVED */}
                </div>
            </div>

            {/* Content Section: Conditionally Render based on Role */}

            {isFaculty || isHOD ? (
                <div className="w-full">

                    {/* Year Filter Dropdown (HOD Only) - REMOVED from here */}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Column 1: Event Information */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden h-fit">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>
                                <span className="truncate">Event Information</span>
                            </h3>
                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                                        <Clock size={12} /> Registration Ends
                                    </span>
                                    <span className="font-medium text-gray-900 text-sm block truncate">
                                        {competition.registration_deadline ? new Date(competition.registration_deadline).toLocaleDateString() : "TBA"}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                                        <Calendar size={12} /> Event Date
                                    </span>
                                    <span className="font-medium text-gray-900 text-sm block truncate">
                                        {competition.event_date ? new Date(competition.event_date).toLocaleDateString() : "TBA"}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                                        <Users size={12} /> Team Size
                                    </span>
                                    <span className="font-medium text-gray-900 text-sm block truncate">
                                        {competition.min_team_size} - {competition.max_team_size} Members
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                                        <MessageSquare size={12} /> Mode
                                    </span>
                                    <span className="font-medium text-gray-900 text-sm block truncate">
                                        {competition.mode || "Online"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Unregistered Students */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                <span className="truncate">Unregistered ({totalUnregisteredCount})</span>
                            </h3>

                            {/* Embedded Year Filter Dropdown */}
                            {isHOD && (
                                <div className="mb-3">
                                    <div className="relative">
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            className="w-full appearance-none bg-gray-100 border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                        >
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="overflow-y-auto space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex-1">
                                {isHOD && unregisteredSections ? (
                                    filterByYear(unregisteredSections).length > 0 ? (
                                        filterByYear(unregisteredSections).map((group, gIdx) => (
                                            <div key={gIdx} className="mb-3">
                                                <div className="space-y-2">
                                                    {group.sections.map((sec, sIdx) => (
                                                        <div
                                                            key={sIdx}
                                                            onClick={() => handleSectionClick(sec.students, group.year, sec.name, 'Unregistered')}
                                                            className="flex justify-between items-center text-sm p-2 bg-white border border-gray-100 rounded-md shadow-sm cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                                        >
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
                                            </div>
                                        ))
                                    ) : <div className="text-sm text-gray-400 text-center py-4">No unregistered sections found for {selectedYear}</div>
                                ) : (
                                    /* Faculty/Original View - Flat List */
                                    (statsData.unregistered && statsData.unregistered.length > 0) ? (
                                        statsData.unregistered.map(student => (
                                            <div key={student.id} className="text-sm p-3 bg-red-50 rounded-lg border border-red-100 mb-2">
                                                <div className="font-medium text-gray-900 truncate">{student.name}</div>
                                                <div className="text-xs text-red-600 truncate">{student.regNo} {student.section && `(${student.section})`}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-400 text-center py-4">No unregistered students</div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Column 3: Registered Students */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <span className="truncate">Registered ({statsData.registered?.length || 0})</span>
                            </h3>

                            {/* Embedded Year Filter Dropdown */}
                            {isHOD && (
                                <div className="mb-3">
                                    <div className="relative">
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            className="w-full appearance-none bg-gray-100 border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                        >
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="h-96 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                {isHOD && statsData.registered_sections ? (
                                    filterByYear(statsData.registered_sections).length > 0 ? (
                                        filterByYear(statsData.registered_sections).map((group, gIdx) => (
                                            <div key={gIdx} className="mb-3">
                                                <div className="space-y-2">
                                                    {group.sections.map((sec, sIdx) => (
                                                        <div
                                                            key={sIdx}
                                                            onClick={() => handleSectionClick(sec.students, group.year, sec.name, 'Registered Students')}
                                                            className="flex justify-between items-center text-sm p-2 bg-white border border-gray-100 rounded-md shadow-sm cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                                        >
                                                            <div className="font-medium text-gray-900 flex items-center gap-2 truncate">
                                                                <Layers size={14} className="text-gray-400 flex-shrink-0" />
                                                                <span className="truncate">Section {sec.name}</span>
                                                            </div>
                                                            <div className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded font-medium border border-green-100 whitespace-nowrap">
                                                                {sec.count} Reg
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : <div className="text-sm text-gray-400 text-center py-4">No registrations yet for {selectedYear}</div>
                                ) : (
                                    /* Faculty/Original View - Flat List */
                                    (statsData.registered && statsData.registered.length > 0) ? (
                                        statsData.registered.map(student => (
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
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-400 text-center py-4">No registrations yet</div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Column 4: Winners */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                <span className="truncate">Winners ({statsData.winners?.length || 0})</span>
                            </h3>

                            {/* Embedded Year Filter Dropdown */}
                            {isHOD && (
                                <div className="mb-3">
                                    <div className="relative">
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            className="w-full appearance-none bg-gray-100 border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                        >
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="h-96 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                {statsData.winners?.filter(student => selectedYear === 'All' || student.admission_year === selectedYear).length > 0 ? (
                                    statsData.winners?.filter(student => selectedYear === 'All' || student.admission_year === selectedYear).map(student => (
                                        <div key={student.id} className="text-sm p-3 bg-green-50 rounded-lg border border-green-100">
                                            <div className="font-medium text-gray-900 truncate">{student.name}</div>
                                            <div className="text-xs text-green-600 truncate">{student.regNo} {student.section && `(${student.section})`}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-400 text-center py-4">No winners yet for {selectedYear}</div>
                                )}
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
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Globe size={16} /> Venue
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {competition.venue || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
            <StudentListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
                students={selectedStudents}
            />
        </div >
    );
};

export default CompetitionDetails;
