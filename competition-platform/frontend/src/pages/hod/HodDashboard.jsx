import React, { useState, useEffect } from 'react';
import HodLayout from './HodLayout';
import { ChevronDown, CheckCircle, User, FileText, Users, Award, FileDown, BarChart3, TrendingUp, Calendar, ChevronRight, Menu, BookOpen, AlertCircle } from 'lucide-react';
import { getDepartmentUsers, downloadWinnersReport } from '../../services/hodService';
import { api } from '../../services/api';
import StudentListTable from '../common/StudentListTable';
import { useNavigate } from 'react-router-dom';


const HodDashboard = () => {
    const navigate = useNavigate();
    const [selectedSection, setSelectedSection] = useState('All Sections');
    const [activeTab, setActiveTab] = useState('2nd'); // 2nd, 3rd, 4th
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);


    // Feature State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sectionData, setSectionData] = useState([]); // Real Data now

    const handleDownloadReport = async () => {
        try {
            await downloadWinnersReport();
        } catch (error) {
            alert("Failed to download report");
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const fetchUsers = async () => {
            setLoading(true); // Show loading when switching years
            try {
                // Fetch users for the ACTIVE TAB Year
                const data = await getDepartmentUsers(activeTab);
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
    }, [activeTab]);

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

    // Filter Sections based on Tab
    // Always filter by academic year as Overview is gone.
    const filteredSectionData = sectionData.filter(s => s.academicYear === `${activeTab} Year`);

    // Sort sections alphabetically
    const sections = filteredSectionData.length > 0
        ? filteredSectionData.map(s => s.section).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        : [];

    // Stats for "Detailed View" (Specific Section)
    const sectionStudents = students
        .filter(s => s.section === selectedSection)
        .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', undefined, { numeric: true, sensitivity: 'base' }));

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

    // Dynamic Overview Stats for the SELECTED BATCH/YEAR (aggregated from sections)
    const calculateBatchStats = () => {
        // Aggregate
        const totalStd = filteredSectionData.reduce((acc, curr) => acc + (curr.totalStudents || 0), 0);
        // Note: registered is count of students who registered at least once? Or something else. 
        // Based on backend it is count of students who have registrations.
        // But for dashboard cards we might want total active competitions (global) or something else.
        // The original overviewStats had 'ACTIVE COMPETITIONS'. This is usually department wide not per batch.
        // Let's keep 'ACTIVE COMPETITIONS' global.

        const totalQual = filteredSectionData.reduce((acc, curr) => acc + (curr.qualified || 0), 0);
        const totalPending = filteredSectionData.reduce((acc, curr) => acc + (curr.pending || 0), 0);

        // Active Competitions is global.
        const originalActiveComp = overviewStats.find(s => s.label === 'ACTIVE COMPETITIONS')?.value || '0';

        return [
            { label: `${activeTab.toUpperCase()} YEAR STUDENTS`, value: totalStd.toString(), subtext: `Across ${filteredSectionData.length} Sections`, borderLeft: 'border-l-4 border-blue-500' },
            { label: 'ACTIVE COMPETITIONS', value: originalActiveComp, subtext: 'Ongoing this semester', borderLeft: '' },
            { label: 'SHORTLISTED STUDENTS', value: totalQual.toString(), subtext: 'Qualified Round 1', borderLeft: '' },
            { label: 'PENDING OD REQUESTS', value: totalPending.toString(), subtext: 'Requires Immediate Action', borderLeft: '' },
        ];
    };

    // If 'All Sections' is selected, use calculated stats based on tab. Else use detailed section stats.
    const currentStats = selectedSection === 'All Sections' ? calculateBatchStats() : detailedStats;

    // Student List for Detailed View
    // Map to UI format
    const studentList = sectionStudents.map(s => ({
        id: s.id, // Include ID
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

    // Engagement Stats
    const engagementRate = students.length > 0 ? ((overviewStats.find(s => s.label === 'ACTIVE COMPETITIONS')?.value || 0) / students.length * 100).toFixed(1) : 0;

    // Alerts Logic
    const alerts = [];
    const totalPending = filteredSectionData.reduce((acc, curr) => acc + (curr.pending || 0), 0);
    if (totalPending > 0) alerts.push({ type: 'red', message: `${totalPending} OD Requests pending approval` });

    // Check for low participation
    filteredSectionData.forEach(s => {
        if (s.totalStudents > 0 && (s.registered / s.totalStudents) < 0.2) {
            alerts.push({ type: 'yellow', message: `Low participation in Section ${s.section}` });
        }
    });

    const pieData = filteredSectionData.map(s => ({ name: s.section, value: s.totalStudents }));
    const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <HodLayout>
            {/* Header with Download Button */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {activeTab} Year Dashboard
                        </h1>
                        <p className="text-muted mt-1">
                            {selectedSection === 'All Sections'
                                ? `Overview of ${activeTab} Year Sections`
                                : `Detailed View: ${selectedSection}`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
                    {/* Year Tabs */}
                    <div className="flex bg-muted/10 p-1 rounded-lg border border-border shadow-sm h-10 items-center justify-center sm:justify-start w-full sm:w-auto">
                        {['2nd', '3rd', '4th'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSelectedSection('All Sections'); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'text-muted hover:text-foreground hover:bg-muted/10'
                                    }`}
                            >
                                {tab} Year
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-auto">
                        <button
                            onClick={toggleDropdown}
                            className="bg-card border border-border px-4 py-2 rounded-lg text-sm text-foreground flex items-center justify-between space-x-2 shadow-sm hover:bg-muted/10 w-full sm:w-[200px] h-10"
                        >
                            <span className="truncate">{selectedSection === 'All Sections' ? 'All Sections' : selectedSection}</span>
                            <ChevronDown size={16} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-10 py-1 max-h-60 overflow-y-auto">
                                <button
                                    onClick={() => handleSectionSelect('All Sections')}
                                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/10"
                                >
                                    All Sections
                                </button>
                                {sections.map((section) => (
                                    <button
                                        key={section}
                                        onClick={() => handleSectionSelect(section)}
                                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/10"
                                    >
                                        {section}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {currentStats.map((stat, index) => (
                    <div key={index} className={`bg-card p-6 rounded-xl shadow-sm border border-border ${stat.borderLeft}`}>
                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{stat.label}</h3>
                        <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                        <p className="text-xs text-muted/80">{stat.subtext}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area (Table or Student List) */}
                <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-foreground mb-1">
                                {selectedSection === 'All Sections' ? 'Section-wise Performance' : `${selectedSection} Student List`}
                            </h2>
                            <p className="text-sm text-muted">
                                {selectedSection === 'All Sections' ? 'Participation & qualification overview' : 'Detailed performance report'}
                            </p>
                        </div>
                        {/* Dropdown for Section Selection */}
                        {selectedSection === 'All Sections' && (
                            <div className="relative">
                                <button
                                    onClick={toggleDropdown}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                                >
                                    <span>Filter Section</span>
                                    <ChevronDown size={14} />
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-lg shadow-lg z-10 py-1">
                                        {sections.map((section) => (
                                            <button
                                                key={section}
                                                onClick={() => handleSectionSelect(section)}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Section {section}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedSection !== 'All Sections' && (
                            <button
                                onClick={() => handleSectionSelect('All Sections')}
                                className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                                <ChevronRight size={14} className="rotate-180" />
                                Back to Overview
                            </button>
                        )}
                    </div>

                    {
                        selectedSection === 'All Sections' ? (
                            <div className="overflow-x-auto">
                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {filteredSectionData.map((row, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleSectionSelect(row.section)}
                                            className="bg-card p-4 rounded-xl border border-border shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                                        >
                                            <div className="flex justify-between items-start mb-3 border-b border-border pb-3">
                                                <div>
                                                    <h3 className="text-lg font-bold text-foreground">{row.section}</h3>
                                                    <p className="text-xs text-muted">{row.batch}</p>
                                                </div>
                                                <div className={`px-2 py-1 rounded-md text-xs font-medium ${row.pending > 0 ? 'bg-red-50 text-red-600' : 'bg-muted/10 text-muted'}`}>
                                                    {row.pending} OD Pending
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-3 text-sm text-muted">
                                                <BookOpen size={16} className="text-blue-500" />
                                                <span>{row.classAdvisor || 'Not Assigned'}</span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-center bg-muted/10 rounded-lg p-2">
                                                <div>
                                                    <div className="text-xs text-muted uppercase">Total</div>
                                                    <div className="font-bold text-foreground">{row.totalStudents}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted uppercase">Reg</div>
                                                    <div className="font-bold text-blue-600">{row.registered}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted uppercase">Qual</div>
                                                    <div className="font-bold text-green-600">{row.qualified}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left">
                                            <th className="pb-4 text-xs font-semibold text-muted uppercase w-1/12">Section</th>
                                            <th className="pb-4 text-xs font-semibold text-muted uppercase w-2/12">Faculty</th>
                                            <th className="pb-4 text-xs font-semibold text-muted uppercase w-2/12">Batch</th>
                                            <th className="pb-4 text-xs font-semibold text-muted uppercase w-1/6 text-center">Total Students</th>
                                            <th className="pb-4 text-xs font-semibold text-muted uppercase w-1/6 text-center">Registered</th>
                                            <th className="pb-4 text-xs font-semibold text-muted uppercase w-1/6 text-center">Qualified</th>
                                            <th className="pb-4 text-xs font-semibold text-muted uppercase w-1/6 text-center">OD Pending</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredSectionData.map((row, index) => (
                                            <tr
                                                key={index}
                                                className="group hover:bg-muted/10 transition-colors cursor-pointer"
                                                onClick={() => handleSectionSelect(row.section)}
                                            >
                                                <td className="py-4 text-sm font-semibold text-foreground">{row.section}</td>
                                                <td className="py-4 text-sm text-muted">{row.classAdvisor || 'Not Assigned'}</td>
                                                <td className="py-4 text-sm text-muted/70">{row.batch}</td>
                                                <td className="py-4 text-sm font-medium text-foreground text-center">{row.totalStudents}</td>
                                                <td className="py-4 text-sm text-blue-600 font-medium text-center">{row.registered}</td>
                                                <td className="py-4 text-sm text-green-600 font-medium text-center">{row.qualified}</td>
                                                <td className={`py-4 text-sm font-medium text-center ${row.pending > 0 ? 'text-red-500' : 'text-muted/50'}`}>
                                                    {row.pending}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <StudentListTable
                                    students={studentList}
                                    loading={loading}
                                    onRowClick={(student) => navigate(`/hod/students/${student.id}`)}
                                    emptyMessage="No students found in this section."
                                    role="HOD"
                                    showSection={false}
                                />
                            </div>
                        )
                    }
                </div >

                {/* OD Actions Card */}
                <div className="flex flex-col gap-6 w-full lg:w-[350px] shrink-0">
                    <div className="bg-card rounded-xl shadow-sm border border-border p-6 h-fit">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-bold text-foreground">OD Actions</h2>
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        </div>

                        <p className="text-sm text-muted mb-6 leading-relaxed">
                            You have <span className="font-bold text-foreground">
                                {filteredSectionData.reduce((acc, curr) => acc + (curr.pending || 0), 0)} pending OD {filteredSectionData.reduce((acc, curr) => acc + (curr.pending || 0), 0) === 1 ? 'request' : 'requests'}
                            </span> that require {filteredSectionData.reduce((acc, curr) => acc + (curr.pending || 0), 0) === 1 ? 'validation' : 'validation'} against email evidence.
                        </p>

                        <button
                            onClick={() => navigate('/hod/approvals')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm"
                        >
                            <span>Review Queue</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Quick Links or Stats */}
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md p-6 text-white">
                        <h3 className="font-bold text-lg mb-2">Faculty Directory</h3>
                        <p className="text-purple-100 text-sm mb-4">Manage department staff and view section assignments.</p>
                        <button
                            onClick={() => navigate('/hod/faculty')}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-lg transition-all w-full flex items-center justify-center gap-2"
                        >
                            View Directory
                        </button>
                    </div>
                </div>
            </div >
        </HodLayout>
    );
};

export default HodDashboard;
