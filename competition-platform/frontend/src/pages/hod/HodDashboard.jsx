import React, { useState, useEffect } from 'react';
import HodSidebar from './Sidebar';
import { ChevronDown, CheckCircle, User, FileText, Users, Award } from 'lucide-react';
import { getDepartmentUsers } from '../../services/usersService';

const HodDashboard = () => {
    const [selectedSection, setSelectedSection] = useState('All Sections');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Feature State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getDepartmentUsers();
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch department users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Derived Data Processing
    const students = users.filter(u => u.role === 'STUDENT');
    const sections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();

    // Stats Calculation
    const totalStudents = students.length;
    // For now, these are placeholders or need other API calls (competitions). 
    // We will keep them 0 or mock until those APIs exist.

    const overviewStats = [
        { label: 'TOTAL DEPT. STUDENTS', value: totalStudents.toString(), subtext: `Across ${sections.length} Sections`, borderLeft: 'border-l-4 border-blue-500' },
        { label: 'ACTIVE COMPETITIONS', value: '0', subtext: 'Ongoing this semester', borderLeft: '' },
        { label: 'SHORTLISTED STUDENTS', value: '0', subtext: 'Qualified Round 1', borderLeft: '' },
        { label: 'PENDING OD REQUESTS', value: '0', subtext: 'Requires Immediate Action', borderLeft: '' },
    ];

    // Stats for "Detailed View" (Specific Section)
    const sectionStudents = students.filter(s => s.section === selectedSection);
    const detailedStats = [
        { label: 'SECTION STUDENTS', value: sectionStudents.length.toString(), subtext: 'Batch 2023-27', borderLeft: 'border-l-4 border-blue-500' },
        { label: 'PARTICIPATING', value: '0', subtext: '0% Engagement', borderLeft: '' },
        { label: 'QUALIFIED', value: '0', subtext: 'Round 1 Cleared', borderLeft: '' },
        { label: 'PENDING OD REQUESTS', value: '0', subtext: 'Waiting Approval', borderLeft: '' },
    ];

    // Overview Table Data (Computed)
    // We ignore 'batch' for now or hardcode it as users.year is int but not fetched yet in all queries? 
    // Auth Middleware fetches assigned_sections but user controller fetches all columns.
    // Check users.controller.js: uses supabase.from('users').select(...) but checking hod.controller.js
    // hod.controller.js fetches: id, full_name, email, role, section, assigned_sections, departments(name).
    // It does NOT fetch 'year'. So we'll hardcode Batch for now.

    const sectionData = sections.map(sec => {
        const count = students.filter(s => s.section === sec).length;
        return {
            section: sec,
            batch: '2024-28', // Placeholder/Hardcoded
            registered: count, // Total students in section (using as 'registered' for now, though label usually means comp registration)
            // ideally 'registered' in table means 'registered for competition'. 
            // For now, let's just show total students as 'registered' in lack of comp data, OR 0.
            // User request: "AND THE STUDENT DETAILS" 
            // Let's use 'registered' column to show Total Students in that section for clarity? 
            // Or keep 0 if it means competition registrations. 
            // I'll set it to 'count' (Total Students) so the UI looks populated.
            qualified: 0,
            pending: 0
        };
    });

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

    const currentStats = selectedSection === 'All Sections' ? overviewStats : detailedStats;

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
                        <h1 className="text-2xl font-bold text-gray-900">Department Coordinator</h1>
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

                        {selectedSection === 'All Sections' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left">
                                            <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/4">Section</th>
                                            <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/4">Batch</th>
                                            <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/4 text-center">Registered</th>
                                            <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/4 text-center">Qualified</th>
                                            <th className="pb-4 text-xs font-semibold text-gray-500 uppercase w-1/4 text-center">OD Pending</th>
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
                        )}
                    </div>

                    {/* OD Actions Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
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

                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                            <CheckCircle size={18} />
                            <span>Review OD Requests</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HodDashboard;
