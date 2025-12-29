import React, { useState, useEffect } from 'react';
import HodSidebar from './Sidebar';
import { ChevronDown, CheckCircle, User, FileText, Users, Award } from 'lucide-react';
import { getDepartmentUsers } from '../../services/usersService';
import { api } from '../../services/api';

import { useNavigate } from 'react-router-dom';

const HodDashboard = () => {
    const navigate = useNavigate();
    const [selectedSection, setSelectedSection] = useState('All Sections');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Feature State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sectionData, setSectionData] = useState([]); // Real Data now

    useEffect(() => {
        const controller = new AbortController();
        const fetchUsers = async () => {
            try {
                // Pass signal if your API client supports it, otherwise manually check before setting state
                const data = await getDepartmentUsers();
                if (!controller.signal.aborted) {
                    setUsers(data);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Failed to fetch department users", error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        fetchUsers();
        return () => controller.abort();
    }, []);

    const [overviewStats, setOverviewStats] = useState([
        { label: 'TOTAL DEPT. STUDENTS', value: '...', subtext: 'Loading...', borderLeft: 'border-l-4 border-blue-500' },
        { label: 'ACTIVE COMPETITIONS', value: '...', subtext: 'Loading...', borderLeft: '' },
        { label: 'SHORTLISTED STUDENTS', value: '...', subtext: 'Loading...', borderLeft: '' },
        { label: 'PENDING OD REQUESTS', value: '...', subtext: 'Loading...', borderLeft: '' },
    ]);

    useEffect(() => {
        const controller = new AbortController();
        const fetchStats = async () => {
            try {
                // Note: axios/fetch supports signal, assuming api.get supports config object as second arg
                const resData = await api.get('/api/hod/stats', { signal: controller.signal });

                if (!controller.signal.aborted) {
                    // Old compatibility: if it returns array directly (backward compat)
                    if (resData) {
                        if (Array.isArray(resData.data)) {
                            setOverviewStats(resData.data);
                        }
                        // New Structure: { cards: [], sections: [] }
                        else if (resData.data && resData.data.cards) {
                            setOverviewStats(resData.data.cards);
                            if (resData.data.sections) {
                                setSectionData(resData.data.sections);
                            }
                        } else if (resData.cards) { // Case where API wrapper unwraps it
                            setOverviewStats(resData.cards);
                            if (resData.sections) setSectionData(resData.sections);
                        }
                    }
                }
            } catch (err) {
                // Ignore abort errors
                if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED' && !controller.signal.aborted) {
                    console.error("Failed to fetch dashboard stats", err);
                }
            }
        };
        fetchStats();
        return () => controller.abort();
    }, []);

    // Derived Data Processing for Dropdowns & Detailed Views
    const students = users.filter(u => u.role === 'STUDENT');

    // Sort sections alphabetically
    const sections = sectionData.length > 0
        ? sectionData.map(s => s.section).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        : [...new Set(students.map(s => s.section).filter(Boolean))].sort();

    // Stats for "Detailed View" (Specific Section)
    const sectionStudents = students
        .filter(s => s.section === selectedSection)
        .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', undefined, { numeric: true, sensitivity: 'base' }));

    // Find analytics for selected section
    // Find analytics for selected section
    const currentSectionAnalytics = sectionData.find(s => s.section === selectedSection) || {
        totalStudents: sectionStudents.length,
        batch: 'N/A', // Default if not found
        registered: 0,
        qualified: 0,
        pending: 0
    };

    const detailedStats = [
        { label: 'SECTION STUDENTS', value: currentSectionAnalytics.totalStudents.toString(), subtext: `Batch ${currentSectionAnalytics.batch || 'N/A'}`, borderLeft: 'border-l-4 border-blue-500' },
        { label: 'PARTICIPATING', value: currentSectionAnalytics.registered.toString(), subtext: 'Registered Events', borderLeft: '' },
        { label: 'QUALIFIED', value: currentSectionAnalytics.qualified.toString(), subtext: 'Round 1 Cleared', borderLeft: '' },
        { label: 'PENDING OD REQUESTS', value: currentSectionAnalytics.pending.toString(), subtext: 'Waiting Approval', borderLeft: '' },
    ];

    const currentStats = selectedSection === 'All Sections' ? overviewStats : detailedStats;

    // Student List for Detailed View
    // Map to UI format
    const studentList = sectionStudents.map(s => ({
        name: s.full_name,
        email: s.email,
        reg: s.registration_no,
        icon: s.full_name ? s.full_name.charAt(0).toUpperCase() : 'U',
        status: 'Active',
        statusColor: 'text-green-600'
    }));

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const handleSectionSelect = (section) => {
        setSelectedSection(section);
        setIsDropdownOpen(false);
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <HodSidebar />

            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Head of Department</h1>
                        <p className="text-gray-500 mt-1">
                            {selectedSection === 'All Sections' ? 'Overview of All Sections' : `Detailed View: ${selectedSection}`}
                        </p>
                    </div>

                    <div className="relative">
                        <button
                            onClick={toggleDropdown}
                            className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 flex items-center space-x-2 shadow-sm hover:bg-gray-50 min-w-[200px] justify-between"
                        >
                            <span>{selectedSection === 'All Sections' ? 'All Sections (Overview)' : selectedSection}</span>
                            <ChevronDown size={16} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-full bg-white border border-gray-100 rounded-lg shadow-lg z-10 py-1">
                                <button
                                    onClick={() => handleSectionSelect('All Sections')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    All Sections (Overview)
                                </button>
                                {sections.map((section) => (
                                    <button
                                        key={section}
                                        onClick={() => handleSectionSelect(section)}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        {section}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {currentStats.map((stat, index) => (
                        <div key={index} className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${stat.borderLeft}`}>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{stat.label}</h3>
                            <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                            <p className="text-xs text-gray-400">{stat.subtext}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area (Table or Student List) */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 mb-1">
                                    {selectedSection === 'All Sections' ? 'Section-wise Performance' : `${selectedSection} Student List`}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {selectedSection === 'All Sections' ? 'Participation & qualification overview' : 'Detailed performance report'}
                                </p>
                            </div>
                            {selectedSection !== 'All Sections' && (
                                <button
                                    onClick={() => handleSectionSelect('All Sections')}
                                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    Back to Overview
                                </button>
                            )}
                        </div>

                        {
                            selectedSection === 'All Sections' ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left">
                                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/6">Section</th>
                                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/6">Batch</th>
                                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/6 text-center">Total No of Students</th>
                                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/6 text-center">Total No of Students Registered</th>
                                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/6 text-center">Total No of Students Qualified</th>
                                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/6 text-center">OD Pending</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {sectionData.map((row, index) => (
                                                <tr
                                                    key={index}
                                                    className="group hover:bg-gray-50 transition-colors cursor-pointer"
                                                    onClick={() => handleSectionSelect(row.section)}
                                                >
                                                    <td className="py-4 text-sm font-semibold text-gray-900">{row.section}</td>
                                                    <td className="py-4 text-sm text-gray-500">{row.batch}</td>
                                                    <td className="py-4 text-sm font-medium text-gray-900 text-center">{row.totalStudents}</td>
                                                    <td className="py-4 text-sm text-blue-600 font-medium text-center">{row.registered}</td>
                                                    <td className="py-4 text-sm text-green-600 font-medium text-center">{row.qualified}</td>
                                                    <td className={`py-4 text-sm font-medium text-center ${row.pending > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                        {row.pending}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {studentList.length > 0 ? (
                                        studentList.map((student, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {student.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900">{student.name}</h3>
                                                        <p className="text-xs text-gray-500">{student.reg} <span className="text-gray-300">|</span> {student.email}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-medium ${student.statusColor}`}>
                                                    {student.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No students found in this section.
                                        </div>
                                    )}
                                </div>
                            )
                        }
                    </div >

                    {/* OD Actions Card */}
                    < div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit" >
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-bold text-gray-900">OD Actions</h2>
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            You have <span className="font-bold text-gray-900">
                                0 pending OD requests
                            </span> that require validation against email evidence.
                        </p>

                        <button
                            onClick={() => navigate('/hod/approvals')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                            <CheckCircle size={18} />
                            <span>Review OD Requests</span>
                        </button>
                    </div >
                </div >
            </div >
        </div >
    );
};

export default HodDashboard;
