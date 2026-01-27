import { api } from './api';

// =====================================================
// HOD Service - All HOD-specific API calls
// =====================================================

// Dashboard & Analytics
export const getDashboardAnalysis = async () => {
    const response = await api.get('/api/hod/dashboard-analysis');
    return response.data || response;
};

export const getDepartmentAnalytics = async () => {
    const response = await api.get('/api/hod/analytics');
    return response.data || response;
};

// Student Management
export const getDepartmentUsers = async (year) => {
    const query = year ? `?year=${year}` : '';
    const response = await api.get(`/api/hod/users${query}`);
    return response.data || response;
};

export const getHodStudentDetails = async (id) => {
    try {
        const response = await api.get(`/api/hod/students/${id}`);
        return response.data || response;
    } catch (error) {
        console.error("Error fetching student details for HOD:", error);
        throw error;
    }
};

// Competition Stats
export const getHODCompetitionStats = async (competitionId) => {
    const response = await api.get(`/api/hod/competition/${competitionId}/stats`);
    return response.data || response;
};

// OD Management
export const getPendingODRequests = async () => {
    const response = await api.get('/api/hod/pending-od');
    return response.data || response;
};

export const manageODRequest = async (requestId, status, extraData = {}) => {
    const response = await api.post('/api/hod/manage-od', {
        request_id: requestId,
        status,
        ...extraData
    });
    return response.data || response;
};

// Faculty Directory
export const getDepartmentFaculty = async () => {
    try {
        const response = await api.get('/api/hod/faculty');
        return response.data || response;
    } catch (error) {
        console.error("Error fetching faculty:", error);
        throw error;
    }
};

// Reports
export const downloadWinnersReport = async () => {
    try {
        const response = await api.get('/api/hod/stats/export-winners', {
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response]));
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

export default {
    getDashboardAnalysis,
    getDepartmentAnalytics,
    getDepartmentUsers,
    getHodStudentDetails,
    getHODCompetitionStats,
    getPendingODRequests,
    manageODRequest,
    getDepartmentFaculty,
    downloadWinnersReport
};
