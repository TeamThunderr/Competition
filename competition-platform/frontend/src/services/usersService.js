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

