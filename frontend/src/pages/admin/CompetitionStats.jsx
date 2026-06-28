import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { ArrowLeft, Trophy, Users, CheckCircle, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const CompetitionStats = () => {
    const { id } = useParams();
    const [stats, setStats] = useState(null);
    const [competition, setCompetition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Drill Down State
    const [viewLevel, setViewLevel] = useState('YEARS'); // YEARS -> DEPTS -> SECTIONS -> STUDENTS
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);

    // Navigation Helpers
    const resetDrillDown = () => {
        setViewLevel('YEARS');
        setSelectedYear(null);
        setSelectedDept(null);
        setSelectedSection(null);
    };

    const handleBack = () => {
        if (viewLevel === 'STUDENTS') setViewLevel('SECTIONS');
        else if (viewLevel === 'SECTIONS') setViewLevel('DEPTS');
        else if (viewLevel === 'DEPTS') setViewLevel('YEARS');
    };

    const selectYear = (year) => {
        setSelectedYear(year);
        if (year) setViewLevel('DEPTS');
        else setViewLevel('YEARS');
    };

    const selectDept = (dept) => {
        setSelectedDept(dept);
        if (dept) setViewLevel('SECTIONS');
        else setViewLevel(selectedYear ? 'DEPTS' : 'YEARS');
    };

    const selectSection = (sec) => {
        setSelectedSection(sec);
        if (sec) setViewLevel('STUDENTS');
        else setViewLevel('SECTIONS');
    };

    // Data Filtering & Grouping
    const getFilteredParticipants = () => {
        if (!stats?.participants) return [];
        return stats.participants.filter(p => {
            if (activeYearFilter(p) && activeDeptFilter(p) && activeSectionFilter(p)) return true;
            return false;
        });
    };

    const activeYearFilter = (p) => !selectedYear || p.batch === selectedYear;
    const activeDeptFilter = (p) => !selectedDept || p.department === selectedDept;
    const activeSectionFilter = (p) => !selectedSection || p.section === selectedSection;

    const getGroupedData = (groupByKey) => {
        const relevantParticipants = stats?.participants?.filter(p => {
            // Apply filtering based on current level depth
            if (groupByKey === 'batch') return true; // No filter for top level
            if (groupByKey === 'department') return activeYearFilter(p);
            if (groupByKey === 'section') return activeYearFilter(p) && activeDeptFilter(p);
            return true;
        }) || [];

        const groups = {};
        relevantParticipants.forEach(p => {
            const key = p[groupByKey] || 'Unknown';
            if (!groups[key]) {
                groups[key] = { key, total: 0, shortlisted: 0, winners: 0 };
            }
            groups[key].total++;
            if (p.status === 'Shortlisted') groups[key].shortlisted++;
            if (p.status === 'Winner') groups[key].winners++;
        });

        return Object.values(groups).sort((a, b) => b.total - a.total); // Sort by participation count
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch basic competition details for the title
                const compData = await api.get(`/api/competitions/${id}`);
                setCompetition(compData);

                // Fetch stats
                const statsData = await api.get(`/api/admin/competition/${id}/stats`);
                setStats(statsData);
            } catch (err) {
                console.error("Failed to fetch data", err);
                setError("Failed to load competition statistics.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-200">
                <RoleBasedLoader role="ADMIN" />
            </div>
        );
    }

    if (error || !stats || !competition) {
        return (
            <>
                <div className="flex flex-col items-center justify-center h-full py-20">
                    <div className="text-red-500 dark:text-red-400 mb-4 font-medium">{error || "Data not found"}</div>
                    <Link to="/admin/repository" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors">Return to Repository</Link>
                </div>
            </>
        );
    }

    return (
        <>
                <div className="w-[95%] mx-auto font-sans">
                    {/* Header */}
                    <div className="mb-8 relative text-center">
                        <Link to="/admin/repository" className="absolute left-0 top-0 inline-flex items-center text-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <ArrowLeft size={20} className="mr-2" />
                            Back to Repository
                        </Link>
                        <div className="text-center pt-8">
                            <h1 className="text-2xl font-bold text-foreground">{competition.title}</h1>
                            <p className="text-muted mt-1">Real-time participation and performance statistics.</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4 transition-colors">
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                                <Users size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-foreground">{stats.overall.total}</div>
                                <div className="text-sm text-muted font-medium uppercase">Total Registrations</div>
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4 transition-colors">
                            <div className="p-4 bg-purple-50 text-purple-600 rounded-full dark:bg-purple-900/30 dark:text-purple-300">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-foreground">{stats.overall.shortlisted}</div>
                                <div className="text-sm text-muted font-medium uppercase">Shortlisted</div>
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4 transition-colors">
                            <div className="p-4 bg-yellow-50 text-yellow-600 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-foreground">{stats.overall.winners}</div>
                                <div className="text-sm text-muted font-medium uppercase">Winners</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Interface with Dropdowns */}
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden min-h-[500px] transition-colors">

                        {/* Filter Bar */}
                        {/* Breadcrumb Navigation */}
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                            <div className="flex items-center gap-1 sm:gap-2 text-sm flex-wrap">
                                <button onClick={resetDrillDown} className={`font-medium ${viewLevel === 'YEARS' ? 'text-foreground cursor-default' : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'}`}>
                                    All Years
                                </button>
                                {selectedYear && (
                                    <>
                                        <span className="text-muted">/</span>
                                        <button
                                            onClick={() => setViewLevel('DEPTS')}
                                            className={`font-medium ${viewLevel === 'DEPTS' ? 'text-foreground cursor-default' : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'}`}
                                        >
                                            {selectedYear}
                                        </button>
                                    </>
                                )}
                                {selectedDept && (
                                    <>
                                        <span className="text-muted">/</span>
                                        <button
                                            onClick={() => setViewLevel('SECTIONS')}
                                            className={`font-medium ${viewLevel === 'SECTIONS' ? 'text-foreground cursor-default' : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'}`}
                                        >
                                            {selectedDept}
                                        </button>
                                    </>
                                )}
                                {selectedSection && (
                                    <>
                                        <span className="text-muted">/</span>
                                        <span className="font-medium text-foreground">Section {selectedSection}</span>
                                    </>
                                )}
                            </div>

                            {viewLevel !== 'YEARS' && (
                                <button onClick={handleBack} className="text-sm text-muted hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
                                    <ArrowLeft size={16} /> Back
                                </button>
                            )}
                        </div>

                        <div className="p-0">
                            {/* VIEW: YEARS (Default when nothing selected) */}
                            {viewLevel === 'YEARS' && (
                                <div className="bg-card">
                                    <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/5">
                                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Select Academic Batch</h3>
                                        <span className="text-xs text-muted">Showing all active years</span>
                                    </div>
                                    <div className="divide-y divide-border">
                                        {getGroupedData('batch').map((yearStats) => (
                                            <div
                                                key={yearStats.key}
                                                onClick={() => selectYear(yearStats.key)}
                                                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 hover:bg-muted/10 transition-all cursor-pointer gap-4 sm:gap-0"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base sm:text-lg group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/30 dark:text-blue-300 transition-colors shadow-sm shrink-0">
                                                        {yearStats.key}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">Batch of {yearStats.key}</h4>
                                                        <p className="text-xs text-muted">{yearStats.total} total registrations</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 sm:gap-6 lg:gap-12 w-full sm:w-auto justify-between sm:justify-end">
                                                    <div className="grid grid-cols-3 gap-2 sm:gap-8 text-center sm:text-right w-full sm:w-auto sm:min-w-[300px]">
                                                        <div>
                                                            <div className="text-lg sm:text-xl font-bold text-foreground">{yearStats.total}</div>
                                                            <div className="text-[9px] sm:text-[10px] text-muted uppercase font-semibold tracking-wide">Registered</div>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">{yearStats.shortlisted}</div>
                                                            <div className="text-[9px] sm:text-[10px] text-muted uppercase font-semibold tracking-wide">Qualified</div>
                                                            <div className="hidden sm:block absolute -left-4 top-1 bottom-1 w-px bg-border"></div>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">{yearStats.winners}</div>
                                                            <div className="text-[9px] sm:text-[10px] text-muted uppercase font-semibold tracking-wide">Won</div>
                                                            <div className="hidden sm:block absolute -left-4 top-1 bottom-1 w-px bg-border"></div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="text-muted group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                                                </div>
                                            </div>
                                        ))}
                                        {getGroupedData('batch').length === 0 && <div className="text-muted text-center py-12">No participation data available.</div>}
                                    </div>
                                </div>
                            )}

                            {/* VIEW: DEPARTMENTS (When Year is selected) */}
                            {viewLevel === 'DEPTS' && (
                                <div className="bg-card">
                                    <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/5">
                                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Departments in {selectedYear}</h3>
                                        <span className="text-xs text-muted">Ordered by participation</span>
                                    </div>
                                    <div className="divide-y divide-border">
                                        {getGroupedData('department').map((deptStats) => (
                                            <div
                                                key={deptStats.key}
                                                onClick={() => selectDept(deptStats.key)}
                                                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 hover:bg-muted/10 transition-all cursor-pointer gap-4 sm:gap-0"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs sm:text-sm group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/30 dark:text-indigo-300 transition-colors shadow-sm shrink-0">
                                                        {deptStats.key}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{deptStats.department_name || deptStats.key} Department</h4>
                                                        <p className="text-xs text-muted">{deptStats.total} registrations from {deptStats.key} - {selectedYear}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 sm:gap-6 lg:gap-12 w-full sm:w-auto justify-between sm:justify-end">
                                                    <div className="grid grid-cols-3 gap-2 sm:gap-8 text-center sm:text-right w-full sm:w-auto sm:min-w-[300px]">
                                                        <div>
                                                            <div className="text-lg sm:text-xl font-bold text-foreground">{deptStats.total}</div>
                                                            <div className="text-[9px] sm:text-[10px] text-muted uppercase font-semibold tracking-wide">Registered</div>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">{deptStats.shortlisted}</div>
                                                            <div className="text-[9px] sm:text-[10px] text-muted uppercase font-semibold tracking-wide">Qualified</div>
                                                            <div className="hidden sm:block absolute -left-4 top-1 bottom-1 w-px bg-border"></div>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">{deptStats.winners}</div>
                                                            <div className="text-[9px] sm:text-[10px] text-muted uppercase font-semibold tracking-wide">Won</div>
                                                            <div className="hidden sm:block absolute -left-4 top-1 bottom-1 w-px bg-border"></div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="text-muted group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* VIEW: SECTIONS (When Dept is selected) */}
                            {viewLevel === 'SECTIONS' && (
                                <div className="bg-card">
                                    <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/5">
                                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Sections in {selectedDept}</h3>
                                        <span className="text-xs text-muted">Select a section to view students</span>
                                    </div>
                                    <div className="divide-y divide-border">
                                        {getGroupedData('section').sort((a, b) => a.key.localeCompare(b.key)).map((secStats) => (
                                            <div
                                                key={secStats.key}
                                                onClick={() => selectSection(secStats.key)}
                                                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 hover:bg-muted/10 transition-all cursor-pointer gap-4 sm:gap-0"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-base sm:text-lg group-hover:bg-green-600 group-hover:text-white dark:bg-green-900/30 dark:text-green-300 transition-colors shrink-0">
                                                        {secStats.key}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-foreground group-hover:text-green-600 dark:group-hover:text-green-400">Section {secStats.key}</h4>
                                                        <p className="text-xs text-muted">Class of {selectedDept} - {selectedYear}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end gap-12 sm:mr-4">
                                                    <div className="text-left sm:text-right w-full sm:w-auto">
                                                        <span className="text-xl sm:text-2xl font-bold text-foreground">{secStats.total}</span>
                                                        <span className="text-xs sm:text-sm text-muted ml-2">Students</span>
                                                    </div>
                                                    <ChevronRight className="text-muted group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:translate-x-1 transition-all h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* VIEW: STUDENTS (When Section is selected) */}
                            {viewLevel === 'STUDENTS' && (
                                <div className="bg-card">
                                    <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/5">
                                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                                            <Users size={16} className="text-blue-600 dark:text-blue-400" />
                                            Student List
                                            <span className="text-muted font-normal normal-case">
                                                - ({selectedYear || 'All'} • {selectedDept || 'All'} - {selectedSection ? `Section ${selectedSection}` : 'All Sections'})
                                            </span>
                                        </h3>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-border">
                                            <thead className="bg-muted/5">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Reg No</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Batch</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Dept</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Section</th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-muted uppercase tracking-wider min-w-[120px]">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-card divide-y divide-border">
                                                {getFilteredParticipants().map((student) => (
                                                    <tr key={student.id} className="hover:bg-muted/5 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-semibold text-foreground">{student.full_name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted font-mono">{student.registration_no}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{student.batch}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{student.department}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{student.section}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border 
                                                            ${student.status === 'Winner' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800' :
                                                                    student.status === 'Shortlisted' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                                                                        'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'}`}>
                                                                {student.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                            <Link
                                                                to={`/admin/student/${student.id}`}
                                                                state={{ from: location.pathname }}
                                                                className="text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-sm"
                                                            >
                                                                View Profile
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {getFilteredParticipants().length === 0 && (
                                                    <tr>
                                                        <td colSpan="7" className="px-6 py-10 text-center text-muted">No students found for this selection.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
        </>
    );
};
export default CompetitionStats;
