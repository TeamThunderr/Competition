import { api } from './api';

// Student APIs
export const getMyStudents = async () => {
    const response = await api.get('/api/faculty/students');
    return response.data || response;
};

export const getStudentDetails = async (studentId) => {
    const response = await api.get(`/api/faculty/students/${studentId}`);
    return response.data || response;
};

// Faculty Dashboard APIs
export const getFacultyDashboardStats = async () => {
    const response = await api.get('/api/faculty/dashboard-stats');
    return response.data || response;
};

export const getRecentRegistrations = async () => {
    const response = await api.get('/api/faculty/registrations');
    return response.data || response;
};

// HOD Specific
export const getHodStudentDetails = async (id) => {
    try {
        const response = await api.get(`/api/hod/students/${id}`);
        return response.data || response;
    } catch (error) {
        console.error("Error fetching student details for HOD:", error);
        throw error;
    }
};

export const getDepartmentUsers = async (year) => {
    const query = year ? `?year=${year}` : '';
    const response = await api.get(`/api/hod/users${query}`);
    return response.data || response;
};

// Verification APIs
export const getPendingVerifications = async () => {
    const response = await api.get('/api/faculty/pending-verifications');
    return response.data || response;
};

export const verifyRegistration = async (registrationId, action) => {
    return await api.post('/api/faculty/verify-registration', { registration_id: registrationId, action });
};

// Competition Details APIs
export const getCompetitionStudents = async (competitionId) => {
    const response = await api.get(`/api/faculty/competition/${competitionId}/students`);
    return response.data || response;
};

export const getHODCompetitionStats = async (competitionId) => {
    const response = await api.get(`/api/hod/competition/${competitionId}/stats`);
    return response.data || response;
};

export const syncActiveCompetitions = async () => {
    const response = await api.post('/api/faculty/competitions/sync-active', {});
    return response.data || response;
};

export const downloadParticipationReport = async () => {
    try {
        const response = await api.get('/api/faculty/competitions/export-report', {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Participation_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (e) {
        throw e;
    }
};

// Admin Student Search APIs
export const getStudents = async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    try {
        const data = await api.get(`/api/admin/students?${queryParams}`);
        return data.data;
    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
};

export const getStudentById = async (id) => {
    try {
        const data = await api.get(`/api/admin/student/${id}`);
        return data.data;
    } catch (error) {
        console.error("Error fetching student details:", error);
        throw error;
    }
};

// OD Management APIs
export const getPendingODRequests = async () => {
    const response = await api.get('/api/hod/pending-od');
    return response.data || response;
};

export const manageODRequest = async (requestId, status, extraData = {}) => {
    // status: 'APPROVED' or 'REJECTED'
    // extraData: { timeSlot, duration }
    const response = await api.post('/api/hod/manage-od', { request_id: requestId, status, ...extraData });
    return response.data || response;
};


export const getDepartmentAnalytics = async () => {
    const response = await api.get('/api/hod/analytics');
    return response.data || response;
};

export const getDashboardAnalysis = async () => {
    const response = await api.get('/api/hod/dashboard-analysis');
    return response.data || response;
};

// HOD: Get Faculty Directory
export const getDepartmentFaculty = async () => {
    try {
        const response = await api.get('/api/hod/faculty');
        return response.data;
    } catch (error) {
        console.error("Error fetching faculty:", error);
        throw error;
    }
};

export const downloadWinnersReport = async () => {
    try {
        const response = await api.get('/api/hod/stats/export-winners', {
            responseType: 'blob', // Important for file download
        });

        // Create link to download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Winners_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();

    } catch (error) {
        console.error("Error downloading report:", error);
        throw error;
    }
};

// Student OD & Competition APIs
export const getStudentCompetitions = async () => {
    const response = await api.get('/api/student/competitions');
    return response.data || response;
};

export const requestOD = async (competitionId, reason) => {
    const response = await api.post('/api/student/request-od', { competition_id: competitionId, reason });
    return response.data || response;
};

export default {
    getMyStudents,
    getStudentDetails,
    getFacultyDashboardStats,
    getRecentRegistrations,
    getPendingVerifications,
    verifyRegistration,
    getCompetitionStudents,
    getHODCompetitionStats,
    getPendingODRequests,
    manageODRequest,
    getDepartmentUsers,
    getDepartmentAnalytics,
    getDashboardAnalysis,
    getHodStudentDetails,
    getDepartmentFaculty,
    downloadWinnersReport,
    getStudentCompetitions,
    requestOD,
    syncActiveCompetitions,
    downloadParticipationReport
};
