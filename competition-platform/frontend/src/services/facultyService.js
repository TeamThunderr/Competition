import { api } from './api';

// =====================================================
// Faculty Service - All Faculty-specific API calls
// =====================================================

// Dashboard
export const getDashboardStats = async () => {
    const response = await api.get('/api/faculty/dashboard-stats');
    return response.data || response;
};

// Student Management
export const getMyStudents = async () => {
    const response = await api.get('/api/faculty/students');
    return response.data || response;
};

export const getStudentDetails = async (studentId) => {
    const response = await api.get(`/api/faculty/students/${studentId}`);
    return response.data || response;
};

// Registrations
export const getRecentRegistrations = async () => {
    const response = await api.get('/api/faculty/registrations');
    return response.data || response;
};

// Verification
export const getPendingVerifications = async () => {
    const response = await api.get('/api/faculty/pending-verifications');
    return response.data || response;
};

export const getPendingTeamVerifications = async () => {
    const response = await api.get('/api/faculty/pending-teams');
    return response.data || response;
};

export const verifyRegistration = async (registrationId, action) => {
    return await api.post('/api/faculty/verify-registration', {
        registration_id: registrationId,
        action
    });
};

// Competition Management
export const getCompetitionStudents = async (competitionId) => {
    const response = await api.get(`/api/faculty/competition/${competitionId}/students`);
    return response.data || response;
};

export const syncCompetition = async (competitionId) => {
    const response = await api.post(`/api/faculty/competition/${competitionId}/sync`);
    return response.data || response;
};

export const syncActiveCompetitions = async () => {
    const response = await api.post('/api/faculty/competitions/sync-active', {});
    return response.data || response;
};

// Reports
export const downloadParticipationReport = async () => {
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
};

export default {
    getDashboardStats,
    getMyStudents,
    getStudentDetails,
    getRecentRegistrations,
    getPendingVerifications,
    getPendingTeamVerifications,
    verifyRegistration,
    getCompetitionStudents,
    syncCompetition,
    syncActiveCompetitions,
    downloadParticipationReport
};
