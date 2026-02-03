import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { getMyStudents } from '../../services/facultyService';
import StudentListTable from '../common/StudentListTable';

const StudentList = () => {
    const navigate = useNavigate();
    const [isUploadMode, setIsUploadMode] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getMyStudents();
                // Map backend user format to UI format
                // UI: rollNo, name, section, email, status (active)
                const mappedStudents = data.map(s => ({
                    id: s.id,
                    rollNo: s.registration_no,
                    name: s.full_name,
                    section: s.section,
                    email: s.email,
                }));
                setStudents(mappedStudents);
            } catch (error) {
                console.error("Failed to fetch students", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <Sidebar />

            <main className="flex-1 md:ml-sidebar p-8">
                {/* Page Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
                        <p className="text-muted mt-2">Manage your section students and monitor their progress.</p>
                    </div>
                    <div>
                        {isUploadMode ? (
                            <button
                                onClick={() => setIsUploadMode(false)}
                                className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted/10 transition-colors font-medium shadow-sm"
                            >
                                <X size={18} />
                                Cancel Upload
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsUploadMode(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium shadow-sm"
                            >
                                <Upload size={18} />
                                Upload Excel
                            </button>
                        )}
                    </div>
                </div>

                {/* Upload Section (Conditional) */}
                {isUploadMode && (
                    <div className="bg-card p-8 rounded-xl border border-border shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h2 className="text-lg font-bold text-foreground mb-6">Bulk Upload Students</h2>

                        <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-colors cursor-pointer group">
                            <div className="w-16 h-16 bg-blue-50 text-brand-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform dark:bg-blue-900/30 dark:text-blue-300">
                                <FileSpreadsheet size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Drag and drop Excel file</h3>
                            <p className="text-sm text-muted mt-2">Columns: Roll No, Name, Email</p>

                            <button className="mt-6 px-6 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted/10 transition-colors">
                                Browse Files
                            </button>
                        </div>
                    </div>
                )}

                {/* Students List Section */}
                <StudentListTable
                    students={students}
                    loading={loading}
                    onRowClick={(student) => navigate(`/faculty/students/${student.id}`)}
                    emptyMessage="No students found."
                    role="FACULTY"
                />
            </main>
        </div>
    );
};

export default StudentList;
