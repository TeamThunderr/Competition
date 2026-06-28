import React, { useState, useEffect } from 'react';
import HodLayout from './HodLayout';
import { ChevronDown, CheckCircle, User, FileText, Users, Award, FileDown, BarChart3, TrendingUp, Calendar, ChevronRight, Menu, BookOpen, AlertCircle } from 'lucide-react';
import { getDepartmentUsers, downloadWinnersReport } from '../../services/hodService';
import { api } from '../../services/api';
import StudentListTable from '../common/StudentListTable';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';


const HodDashboard = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [selectedSection, setSelectedSection] = useState('All Sections');
    const [activeTab, setActiveTab] = useState('2nd'); // 2nd, 3rd, 4th
    const [isTopDropdownOpen, setIsTopDropdownOpen] = useState(false);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);


    // Feature State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sectionData, setSectionData] = useState([]); // Real Data now

    const handleDownloadReport = async () => {
        try {
            await downloadWinnersReport();
        } catch (error) {
            addToast("Failed to download report", "error");
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
        registeredCount: s.registrations ? s.registrations.length : 0,
        icon: s.full_name ? s.full_name.charAt(0).toUpperCase() : 'U',
        status: 'Active',
        statusColor: 'text-green-600'
    }));

    const toggleTopDropdown = () => setIsTopDropdownOpen(!isTopDropdownOpen);
    const toggleFilterDropdown = () => setIsFilterDropdownOpen(!isFilterDropdownOpen);

    const handleSectionSelect = (section) => {
        setSelectedSection(section);
        setIsTopDropdownOpen(false);
        setIsFilterDropdownOpen(false);
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
        <>
            {/* Header with Download Button */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur-md pt-4 pb-4 border-b border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground">
                            {activeTab} Year Dashboard
                        </h1>
                        <p className="text-sm text-muted mt-0.5">
                            {selectedSection === 'All Sections'
                                ? `Overview of ${activeTab} Year Sections`
                                : `Detailed View: ${selectedSection}`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
                    {/* Year Tabs */}
                    <div className="flex bg-muted/20 p-1 rounded-xl border border-border shadow-inner h-11 items-center justify-center sm:justify-start w-full sm:w-auto">
                        {['2nd', '3rd'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSelectedSection('All Sections'); }}
                                className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-card text-blue-600 shadow-sm dark:bg-zinc-800 dark:text-blue-400'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                                    }`}
                            >
                                {tab} Year
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-auto">
                        <button
                            onClick={toggleTopDropdown}
                            className="bg-card border border-border px-4 py-2 rounded-xl text-sm font-medium text-foreground flex items-center justify-between space-x-2 shadow-sm hover:bg-muted/10 w-full sm:w-[160px] h-11 transition-colors"
                        >
                            <span className="truncate">{selectedSection === 'All Sections' ? 'All Sections' : selectedSection}</span>
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isTopDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isTopDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
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
                                        Section {section}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
                {currentStats.map((stat, index) => (
                    <div key={index} className="bg-card p-4 md:p-6 rounded-2xl shadow-sm border border-border/60 relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${stat.borderLeft.includes('blue') ? 'bg-blue-500' : 'bg-transparent'} transition-colors group-hover:bg-blue-400`} />
                        <h3 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 md:mb-2 line-clamp-1">{stat.label}</h3>
                        <div className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-1">{stat.value}</div>
                        <p className="text-[10px] md:text-xs text-muted font-medium line-clamp-1">{stat.subtext}</p>
                    </div>
                ))}
            </div>

            <div className="w-full">
                {/* Main Content Area (Table or Student List) */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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
                                    onClick={toggleFilterDropdown}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                                >
                                    <span>Filter Section</span>
                                    <ChevronDown size={14} />
                                </button>
                                {isFilterDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
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
                                            className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
                                        >
                                            {/* Top Row: Section & Badge */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-lg">
                                                        {row.section}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-bold text-foreground leading-tight">Section {row.section}</h3>
                                                        <p className="text-xs text-muted font-medium mt-0.5">Batch {row.batch}</p>
                                                    </div>
                                                </div>
                                                {row.pending > 0 && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20 shadow-sm animate-pulse">
                                                        <AlertCircle size={12} />
                                                        {row.pending} OD Pending
                                                    </div>
                                                )}
                                            </div>

                                            {/* Faculty */}
                                            <div className="flex items-center gap-2 mb-4 text-xs font-medium text-muted bg-muted/10 p-2 rounded-lg">
                                                <User size={14} className="text-blue-500" />
                                                <span>{row.classAdvisor || 'No Advisor Assigned'}</span>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-muted/10 rounded-xl p-2 text-center border border-border/50">
                                                    <div className="text-[10px] text-muted font-bold uppercase mb-0.5">Total</div>
                                                    <div className="font-black text-foreground text-sm">{row.totalStudents}</div>
                                                </div>
                                                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-2 text-center border border-blue-100 dark:border-blue-800/30">
                                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mb-0.5">Reg</div>
                                                    <div className="font-black text-blue-700 dark:text-blue-300 text-sm">{row.registered}</div>
                                                </div>
                                                <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-2 text-center border border-green-100 dark:border-green-800/30">
                                                    <div className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase mb-0.5">Qual</div>
                                                    <div className="font-black text-green-700 dark:text-green-300 text-sm">{row.qualified}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <table className="w-full hidden md:table">
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
                                    showRegisteredCount={true}
                                />
                            </div>
                        )
                    }
                </div >
            </div >
        </>
    );
};

export default HodDashboard;
