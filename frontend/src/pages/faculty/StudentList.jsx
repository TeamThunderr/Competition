import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Upload, FileSpreadsheet, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getMyStudents, bulkUploadStudents } from '../../services/facultyService';
import StudentListTable from '../common/StudentListTable';

const StudentList = () => {
    const navigate = useNavigate();
    const [isUploadMode, setIsUploadMode] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadStatus, setUploadStatus] = useState(null); // 'idle', 'uploading', 'success', 'error'
    const [uploadMessage, setUploadMessage] = useState('');
    const fileInputRef = React.useRef(null);
    const [dragActive, setDragActive] = useState(false);

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

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleUpload(file);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async (file) => {
        if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
            setUploadStatus('error');
            setUploadMessage('Invalid file type. Please upload Excel or CSV.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploadStatus('uploading');
            setUploadMessage('Processing file...');
            const response = await bulkUploadStudents(formData);

            setUploadStatus('success');
            setUploadMessage(response.message || 'Upload successful!');

            // Refresh list after short delay
            setTimeout(() => {
                fetchStudents();
                setIsUploadMode(false);
                setUploadStatus('idle');
                setUploadMessage('');
            }, 2000);

        } catch (error) {
            console.error("Upload failed", error);
            setUploadStatus('error');
            setUploadMessage(error.response?.data?.error || 'Upload failed. Please check the file format.');
        }
    };

    return (
        <>
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

                        <div
                            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group relative
                                ${dragActive ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-border hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-900/10'}
                            `}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                            />

                            {uploadStatus === 'uploading' ? (
                                <div className="flex flex-col items-center animate-pulse">
                                    <Loader2 size={48} className="text-brand-600 animate-spin mb-4" />
                                    <h3 className="text-lg font-semibold text-foreground">Uploading...</h3>
                                    <p className="text-sm text-muted mt-2">{uploadMessage}</p>
                                </div>
                            ) : uploadStatus === 'success' ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">Success!</h3>
                                    <p className="text-sm text-muted mt-2">{uploadMessage}</p>
                                </div>
                            ) : uploadStatus === 'error' ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle size={32} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-600">Upload Failed</h3>
                                    <p className="text-sm text-muted mt-2">{uploadMessage}</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setUploadStatus('idle'); }}
                                        className="mt-4 text-sm text-brand-600 hover:underline"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-blue-50 text-brand-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform dark:bg-blue-900/30 dark:text-blue-300">
                                        <FileSpreadsheet size={32} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {dragActive ? 'Drop file to upload' : 'Drag and drop Excel file'}
                                    </h3>
                                    <p className="text-sm text-muted mt-2">Columns: Register No, Name, Email (Required)</p>
                                    <button className="mt-6 px-6 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted/10 transition-colors">
                                        Browse Files
                                    </button>
                                </>
                            )}
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
        </>
    );
};

export default StudentList;
