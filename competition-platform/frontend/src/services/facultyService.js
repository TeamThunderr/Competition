import { api } from './api';

// Sync students for a specific competition
export const syncCompetition = async (competitionId) => {
    try {
        const response = await api.post(`/api/faculty/sync-competition/${competitionId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// You can move other faculty related services here later if needed
