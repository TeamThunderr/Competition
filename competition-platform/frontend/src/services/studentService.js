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
export const uploadProof = async (competitionId, proofUrl, proofType) => {
    return await api.post('/api/student/upload-proof', {
        competition_id: competitionId,
        proof_url: proofUrl,
        proof_type: proofType
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

// Team Status Check
export const checkTeamStatus = async (competitionId) => {
    // We can't easily check this via API unless we have an endpoint.
    // For now, let's use supabase directly here as a quick fix, OR add an endpoint.
    // The previous implementation (Step 162 in logs) suggested adding it here.
    // Let's check `StudentCompetitions.jsx` to see how it was doing it before. 
    // Wait, the previous logs showed direct supabase usage in StudentCompetitions.jsx for this?
    // No, the error says `studentService.checkTeamStatus is not a function`.
    // So we need to implement it.

    // Implementation using Supabase directly (Two-step to avoid 406 embedding error)
    const { data: { user } } = await import('./supabaseClient').then(m => m.supabase.auth.getUser());
    if (!user) return null;

    // 1. Get Team Member ID (Fetch all to avoid 406 on empty/multiple)


    // Wait, we need to filter by competition_id which is in 'teams'. 
    // If we can't join, we have to fetch all team memberships and then check teams?
    // OR, better: Query 'teams' and join 'team_members'?
    // Let's try fetching ALL teams for this user.

    // Alternative: Reverse the query.
    // Query 'teams' where competition_id = X, and verify membership.
    // But RLS policies often restrict listing teams.

    // Best approach given constraints:
    // 1. Fetch team_members for this user (usually few).
    // 2. Fetch the specific team that matches competition_id.

    const { data: myTeams } = await import('./supabaseClient').then(m => m.supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id));

    if (!myTeams || myTeams.length === 0) return null;

    const teamIds = myTeams.map(t => t.team_id);

    const { data: teamData, error: teamError } = await import('./supabaseClient').then(m => m.supabase
        .from('teams')
        .select('id, team_name, leader_id, verification_status, competition_id')
        .in('id', teamIds)
        .eq('competition_id', competitionId)
        .single());

    if (teamError || !teamData) return null;
    return teamData;
};

// Team Proof Upload
export const uploadTeamProof = async (teamId, proofUrl) => {
    return await api.post('/api/teams/upload-proof', {
        team_id: teamId,
        proof_url: proofUrl
    });
};

// Export as object for convenience
export const studentService = {
    getAllCompetitions,
    checkStatus,
    uploadProof,
    requestOD,
    getProfile,
    checkTeamStatus,
    uploadTeamProof
};

export default studentService;
