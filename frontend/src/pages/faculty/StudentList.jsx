import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getMyStudents } from '../../services/facultyService';
import StudentListTable from '../common/StudentListTable';

const StudentList = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

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



    return (
        <>
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
                        <p className="text-muted mt-2">Manage your section students and monitor their progress.</p>
                    </div>
                </div>
                
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
