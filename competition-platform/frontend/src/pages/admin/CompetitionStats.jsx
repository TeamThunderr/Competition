import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <RoleBasedLoader role="ADMIN" />
            </div>
        );
    }

    if (error || !stats || !competition) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <div className="flex-1 ml-64 p-8 flex flex-col items-center justify-center">
                    <div className="text-red-500 mb-4">{error || "Data not found"}</div>
                    <Link to="/admin/repository" className="text-blue-600 hover:underline">Return to Repository</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8 font-sans">
                <div className="w-[95%] mx-auto">
                    {/* Header */}
                    <div className="mb-8 relative text-center">
                        <Link to="/admin/repository" className="absolute left-0 top-0 inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                            <ArrowLeft size={20} className="mr-2" />
                            Back to Repository
                        </Link>
                        <div className="text-center pt-8">
                            <h1 className="text-2xl font-bold text-gray-900">{competition.title}</h1>
                            <p className="text-gray-500 mt-1">Real-time participation and performance statistics.</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                                <Users size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{stats.overall.total}</div>
                                <div className="text-sm text-gray-500 font-medium uppercase">Total Registrations</div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-4 bg-purple-50 text-purple-600 rounded-full">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{stats.overall.shortlisted}</div>
                                <div className="text-sm text-gray-500 font-medium uppercase">Shortlisted</div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="p-4 bg-yellow-50 text-yellow-600 rounded-full">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{stats.overall.winners}</div>
                                <div className="text-sm text-gray-500 font-medium uppercase">Winners</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Interface with Dropdowns */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">

                        {/* Filter Bar */}
                        {/* Breadcrumb Navigation */}
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <button onClick={resetDrillDown} className={`font-medium ${viewLevel === 'YEARS' ? 'text-gray-900 cursor-default' : 'text-blue-600 hover:text-blue-800'}`}>
                                    All Years
                                </button>
                                {selectedYear && (
                                    <>
                                        <span className="text-gray-400">/</span>
                                        <button
                                            onClick={() => setViewLevel('DEPTS')}
                                            className={`font-medium ${viewLevel === 'DEPTS' ? 'text-gray-900 cursor-default' : 'text-blue-600 hover:text-blue-800'}`}
                                        >
                                            {selectedYear}
                                        </button>
                                    </>
                                )}
                                {selectedDept && (
                                    <>
                                        <span className="text-gray-400">/</span>
                                        <button
                                            onClick={() => setViewLevel('SECTIONS')}
                                            className={`font-medium ${viewLevel === 'SECTIONS' ? 'text-gray-900 cursor-default' : 'text-blue-600 hover:text-blue-800'}`}
                                        >
                                            {selectedDept}
                                        </button>
                                    </>
                                )}
                                {selectedSection && (
                                    <>
                                        <span className="text-gray-400">/</span>
                                        <span className="font-medium text-gray-900">Section {selectedSection}</span>
                                    </>
                                )}
                            </div>

                            {viewLevel !== 'YEARS' && (
                                <button onClick={handleBack} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                                    <ArrowLeft size={16} /> Back
                                </button>
                            )}
                        </div>

                        <div className="p-0">
                            {/* VIEW: YEARS (Default when nothing selected) */}
                            {viewLevel === 'YEARS' && (
                                <div className="bg-white">
                                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Select Academic Batch</h3>
                                        <span className="text-xs text-gray-500">Showing all active years</span>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {getGroupedData('batch').map((yearStats) => (
                                            <div
                                                key={yearStats.key}
                                                onClick={() => selectYear(yearStats.key)}
                                                className="group flex items-center justify-between p-6 hover:bg-blue-50 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                                        {yearStats.key}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-700">Batch of {yearStats.key}</h4>
                                                        <p className="text-xs text-gray-500">{yearStats.total} total registrations</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 sm:gap-12 w-full sm:w-auto justify-end">
                                                    <div className="grid grid-cols-3 gap-8 text-right min-w-[300px]">
                                                        <div>
                                                            <div className="text-xl font-bold text-gray-900">{yearStats.total}</div>
                                                            <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Registered</div>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="text-xl font-bold text-purple-600">{yearStats.shortlisted}</div>
                                                            <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Qualified</div>
                                                            <div className="absolute -left-4 top-1 bottom-1 w-px bg-gray-100"></div>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="text-xl font-bold text-yellow-600">{yearStats.winners}</div>
                                                            <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Won</div>
                                                            <div className="absolute -left-4 top-1 bottom-1 w-px bg-gray-100"></div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all h-6 w-6" />
                                                </div>
                                            </div>
                                        ))}
                                        {getGroupedData('batch').length === 0 && <div className="text-gray-500 text-center py-12">No participation data available.</div>}
                                    </div>
                                </div>
                            )}

                            {/* VIEW: DEPARTMENTS (When Year is selected) */}
                            {viewLevel === 'DEPTS' && (
                                <div className="bg-white">
                                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Departments in {selectedYear}</h3>
                                        <span className="text-xs text-gray-500">Ordered by participation</span>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {getGroupedData('department').map((deptStats) => (
                                            <div
                                                key={deptStats.key}
                                                onClick={() => selectDept(deptStats.key)}
                                                className="group flex items-center justify-between p-6 hover:bg-indigo-50 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                                                        {deptStats.key}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 group-hover:text-indigo-700">{deptStats.department_name || deptStats.key} Department</h4>
                                                        <p className="text-xs text-gray-500">{deptStats.total} registrations from {deptStats.key} - {selectedYear}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 sm:gap-12 w-full sm:w-auto justify-end">
                                                    <div className="grid grid-cols-3 gap-8 text-right min-w-[300px]">
                                                        <div>
                                                            <div className="text-xl font-bold text-gray-900">{deptStats.total}</div>
                                                            <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Registered</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xl font-bold text-purple-600">{deptStats.shortlisted}</div>
                                                            <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Qualified</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xl font-bold text-yellow-600">{deptStats.winners}</div>
                                                            <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Won</div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all h-6 w-6" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* VIEW: SECTIONS (When Dept is selected) */}
                            {viewLevel === 'SECTIONS' && (
                                <div className="bg-white">
                                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Sections in {selectedDept}</h3>
                                        <span className="text-xs text-gray-500">Select a section to view students</span>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {getGroupedData('section').sort((a, b) => a.key.localeCompare(b.key)).map((secStats) => (
                                            <div
                                                key={secStats.key}
                                                onClick={() => selectSection(secStats.key)}
                                                className="group flex items-center justify-between p-6 hover:bg-green-50 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                                                        {secStats.key}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 group-hover:text-green-700">Section {secStats.key}</h4>
                                                        <p className="text-xs text-gray-500">Class of {selectedDept} - {selectedYear}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-12 mr-4">
                                                    <div className="text-right">
                                                        <span className="text-2xl font-bold text-gray-900">{secStats.total}</span>
                                                        <span className="text-sm text-gray-500 ml-2">Students</span>
                                                    </div>
                                                    <ChevronRight className="text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all h-6 w-6" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* VIEW: STUDENTS (When Section is selected) */}
                            {viewLevel === 'STUDENTS' && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Student List ({selectedYear || 'All'} • {selectedDept || 'All'} - {selectedSection ? `Section ${selectedSection}` : 'All Sections'})</h3>
                                    <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reg No</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dept</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Section</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {getFilteredParticipants().map((student) => (
                                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-semibold text-gray-900">{student.full_name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{student.registration_no}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.batch}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.department}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.section}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border 
                                                            ${student.status === 'Winner' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                    student.status === 'Shortlisted' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                        'bg-green-50 text-green-700 border-green-200'}`}>
                                                                {student.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                            <Link
                                                                to={`/admin/student/${student.id}`}
                                                                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md text-xs transition-colors shadow-sm"
                                                            >
                                                                View Profile
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {getFilteredParticipants().length === 0 && (
                                                    <tr>
                                                        <td colSpan="8" className="px-6 py-10 text-center text-gray-500">No students found for this selection.</td>
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
            </div>
        </div>
    );
};

export default CompetitionStats;
