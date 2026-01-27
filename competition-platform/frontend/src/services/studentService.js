import { api } from './api';

// =====================================================
// Student Service - All Student-specific API calls
// =====================================================

// Competitions
export const getAllCompetitions = async () => {
    return await api.get('/api/student/competitions');
};

// Gmail Status Check
export const checkStatus = async (competitionId, providerToken) => {
    return await api.post('/api/student/check-status', {
        competition_id: competitionId,
        provider_token: providerToken
    });
};

// Proof Upload
export const uploadProof = async (competitionId, proofUrl) => {
    return await api.post('/api/student/upload-proof', {
        competition_id: competitionId,
        proof_url: proofUrl
    });
};

// OD Requests
export const requestOD = async (competitionId, reason) => {
    return await api.post('/api/student/request-od', {
        competition_id: competitionId,
        reason
    });
};

// Profile
export const getProfile = async () => {
    return await api.get('/api/student/profile');
};

// Export as object for convenience
export const studentService = {
    getAllCompetitions,
    checkStatus,
    uploadProof,
    requestOD,
    getProfile
};

export default studentService;
