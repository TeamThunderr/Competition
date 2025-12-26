import { api } from './api';

export const studentService = {
    // Fetch all competitions (with student specific status like 'my_registration')
    getAllCompetitions: async () => {
        return await api.get('/api/student/competitions');
    },

    // Check Gmail status for verification
    checkStatus: async (competitionId, providerToken) => {
        return await api.post('/api/student/check-status', {
            competition_id: competitionId,
            provider_token: providerToken
        });
    },

    // Submit Proof URL (after file upload)
    uploadProof: async (competitionId, proofUrl) => {
        return await api.post('/api/student/upload-proof', {
            competition_id: competitionId,
            proof_url: proofUrl
        });
    },

    // Request OD
    requestOD: async (competitionId, reason) => {
        return await api.post('/api/student/request-od', {
            competition_id: competitionId,
            reason
        });
    }
};
