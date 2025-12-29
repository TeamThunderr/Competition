import { api } from './api';

// Student APIs
export const getMyStudents = async () => {
    const response = await api.get('/api/faculty/students');
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

// HOD APIs
export const getDepartmentUsers = async () => {
    const response = await api.get('/api/hod/users');
    return response.data || response;
};

// Verification APIs
export const getPendingVerifications = async () => {
    return await api.get('/api/faculty/pending-verifications');
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

// OD Management APIs
export const getPendingODRequests = async () => {
    const response = await api.get('/api/hod/pending-od');
    return response.data || response;
};

export const manageODRequest = async (requestId, status) => {
    // status: 'APPROVED' or 'REJECTED'
    const response = await api.post('/api/hod/manage-od', { request_id: requestId, status });
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
