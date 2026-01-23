// Student Dashboard V2 Service - Consistent with Faculty Dashboard
// Uses same counting logic as faculty for consistency

const supabase = require('../config/supabaseClient');

/**
 * Get student's competition data using V2 logic
 * Ensures consistency with faculty dashboard counts
 */
const getStudentCompetitionsV2 = async (studentId) => {
    try {
        // Get student's registrations (FACT table)
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select(`
                id,
                registered_at,
                verified,
                source,
                proof_url,
                competitions (
                    id,
                    title,
                    description,
                    platform,
                    organizer,
                    registration_deadline,
                    event_date,
                    mode
                )
            `)
            .eq('user_id', studentId)
            .order('registered_at', { ascending: false });

        if (regError) throw regError;

        // Get student's competition status (PROGRESSION table)
        const { data: statuses, error: statusError } = await supabase
            .from('competition_status')
            .select('competition_id, is_shortlisted, is_winner, updated_at')
            .eq('user_id', studentId);

        if (statusError) throw statusError;

        // Combine data with V2 status logic
        const competitions = registrations.map(reg => {
            const status = statuses?.find(s => s.competition_id === reg.competitions.id);
            
            // V2 Status Priority: WON > QUALIFIED > REGISTERED
            let currentStatus = 'REGISTERED';
            let statusColor = 'blue';
            
            if (status?.is_winner) {
                currentStatus = 'WON';
                statusColor = 'gold';
            } else if (status?.is_shortlisted) {
                currentStatus = 'QUALIFIED';
                statusColor = 'green';
            }

            return {
                id: reg.competitions.id,
                title: reg.competitions.title,
                description: reg.competitions.description,
                platform: reg.competitions.platform,
                organizer: reg.competitions.organizer,
                registrationDeadline: reg.competitions.registration_deadline,
                eventDate: reg.competitions.event_date,
                mode: reg.competitions.mode,
                
                // Registration details
                registrationId: reg.id,
                registeredAt: reg.registered_at,
                verified: reg.verified,
                source: reg.source,
                proofUrl: reg.proof_url,
                
                // Status details
                status: currentStatus,
                statusColor: statusColor,
                canRequestOD: status?.is_shortlisted || false, // Only qualified students can request OD
                lastUpdated: status?.updated_at || reg.registered_at
            };
        });

        return competitions;

    } catch (error) {
        console.error('[StudentDashboardV2] Error fetching competitions:', error);
        throw error;
    }
};

/**
 * Get student's dashboard statistics using V2 logic
 */
const getStudentStatsV2 = async (studentId) => {
    try {
        // Count registrations (FACT)
        const { count: registeredCount, error: regError } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', studentId);

        if (regError) throw regError;

        // Count qualified competitions (PROGRESSION)
        const { count: qualifiedCount, error: qualError } = await supabase
            .from('competition_status')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', studentId)
            .eq('is_shortlisted', true);

        if (qualError) throw qualError;

        // Count won competitions (PROGRESSION)
        const { count: wonCount, error: wonError } = await supabase
            .from('competition_status')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', studentId)
            .eq('is_winner', true);

        if (wonError) throw wonError;

        // Count pending OD requests
        const { count: pendingODCount, error: odError } = await supabase
            .from('od_requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', studentId)
            .eq('status', 'PENDING');

        if (odError) throw odError;

        return {
            totalRegistrations: registeredCount || 0,
            qualifiedCompetitions: qualifiedCount || 0,
            wonCompetitions: wonCount || 0,
            pendingODRequests: pendingODCount || 0
        };

    } catch (error) {
        console.error('[StudentDashboardV2] Error fetching stats:', error);
        throw error;
    }
};

/**
 * Check if student can register for a competition
 */
const canRegisterForCompetition = async (studentId, competitionId) => {
    try {
        // Check if already registered
        const { data: existing, error } = await supabase
            .from('registrations')
            .select('id')
            .eq('user_id', studentId)
            .eq('competition_id', competitionId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            throw error;
        }

        return !existing; // Can register if no existing registration

    } catch (error) {
        console.error('[StudentDashboardV2] Error checking registration eligibility:', error);
        return false;
    }
};

module.exports = {
    getStudentCompetitionsV2,
    getStudentStatsV2,
    canRegisterForCompetition
};