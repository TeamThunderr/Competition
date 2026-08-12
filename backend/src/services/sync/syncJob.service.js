const supabase = require('../../config/supabaseClient');

const ACTIVE_STATES = ['QUEUED', 'PROCESSING', 'PAUSED_RATE_LIMIT'];
const TERMINAL_STATES = ['COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED'];

const normalizeSections = (sections = []) => {
    if (!Array.isArray(sections)) return [];
    return sections
        .filter(Boolean)
        .map(section => section.toString().trim())
        .filter(Boolean);
};

const createSyncJob = async ({ competitionId, requestedBy, departmentId, assignedSections }) => {
    const scopeSections = normalizeSections(assignedSections);

    const { data, error } = await supabase.rpc('create_gmail_sync_job', {
        p_competition_id: competitionId,
        p_requested_by: requestedBy,
        p_scope_department_id: departmentId,
        p_scope_sections: scopeSections
    });

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;
    return {
        jobId: result?.job_id || null,
        alreadyRunning: !!result?.already_running,
        message: result?.message || 'Sync queued.'
    };
};

const attachBossJobId = async (syncJobId, bossJobId) => {
    const { error } = await supabase
        .from('sync_jobs')
        .update({ pg_boss_job_id: bossJobId, updated_at: new Date().toISOString() })
        .eq('id', syncJobId);
    if (error) throw error;
};

const getSyncJob = async (syncJobId) => {
    const { data, error } = await supabase
        .from('sync_jobs')
        .select('*')
        .eq('id', syncJobId)
        .single();
    if (error) throw error;
    return data;
};

const markProcessing = async (syncJobId) => updateSyncJob(syncJobId, {
    status: 'PROCESSING',
    started_at: new Date().toISOString(),
    last_heartbeat_at: new Date().toISOString(),
    error_message: null
});

const heartbeat = async (syncJobId, updates = {}) => updateSyncJob(syncJobId, {
    ...updates,
    last_heartbeat_at: new Date().toISOString()
});

const updateSyncJob = async (syncJobId, updates = {}) => {
    const { data, error } = await supabase
        .from('sync_jobs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', syncJobId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

const completeSyncJob = async (syncJobId, status, updates = {}) => updateSyncJob(syncJobId, {
    ...updates,
    status,
    completed_at: new Date().toISOString(),
    last_heartbeat_at: new Date().toISOString()
});

const incrementRetry = async (syncJob) => {
    const nextRetryCount = (syncJob.retry_count || 0) + 1;
    await updateSyncJob(syncJob.id, {
        retry_count: nextRetryCount,
        status: 'QUEUED',
        last_heartbeat_at: new Date().toISOString()
    });
    return nextRetryCount;
};

const findActiveJobForCompetition = async (competitionId) => {
    const { data, error } = await supabase
        .from('sync_jobs')
        .select('*')
        .eq('competition_id', competitionId)
        .in('status', ACTIVE_STATES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data;
};

const findStaleProcessingJobs = async (staleAfterMinutes) => {
    const cutoff = new Date(Date.now() - staleAfterMinutes * 60 * 1000).toISOString();
    const { data, error } = await supabase
        .from('sync_jobs')
        .select('*')
        .eq('status', 'PROCESSING')
        .lt('last_heartbeat_at', cutoff);
    if (error) throw error;
    return data || [];
};

const clearCompetitionSyncState = async (competitionId, fields = {}) => {
    const { error } = await supabase
        .from('competitions')
        .update({
            is_syncing: false,
            ...fields
        })
        .eq('id', competitionId);
    if (error) throw error;
};

module.exports = {
    ACTIVE_STATES,
    TERMINAL_STATES,
    createSyncJob,
    attachBossJobId,
    getSyncJob,
    markProcessing,
    heartbeat,
    updateSyncJob,
    completeSyncJob,
    incrementRetry,
    findActiveJobForCompetition,
    findStaleProcessingJobs,
    clearCompetitionSyncState,
    normalizeSections
};
