const supabase = require('../../config/supabaseClient');

const ACTIVE_STATES = ['QUEUED', 'PROCESSING', 'PAUSED_RATE_LIMIT'];
const TERMINAL_STATES = ['COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED'];

const attachBossJobId = async (discoveryJobId, bossJobId) => {
    const { error } = await supabase
        .from('competition_discovery_jobs')
        .update({ pg_boss_job_id: bossJobId, updated_at: new Date().toISOString() })
        .eq('id', discoveryJobId);
    if (error) throw error;
};

const createDiscoveryJob = async ({ mailboxUserId, requestedBy, mailboxEmail, senderFilter }) => {
    const { data, error } = await supabase.rpc('create_competition_discovery_job', {
        p_mailbox_user_id: mailboxUserId,
        p_requested_by: requestedBy,
        p_mailbox_email: mailboxEmail,
        p_sender_filter: senderFilter
    });

    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    return {
        jobId: result?.job_id || null,
        alreadyRunning: !!result?.already_running,
        message: result?.message || 'Competition discovery queued.'
    };
};

const getDiscoveryJob = async (discoveryJobId) => {
    const { data, error } = await supabase
        .from('competition_discovery_jobs')
        .select('*')
        .eq('id', discoveryJobId)
        .single();
    if (error) throw error;
    return data;
};

const updateDiscoveryJob = async (discoveryJobId, updates = {}) => {
    const { data, error } = await supabase
        .from('competition_discovery_jobs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', discoveryJobId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

const markProcessing = async (discoveryJobId) => updateDiscoveryJob(discoveryJobId, {
    status: 'PROCESSING',
    started_at: new Date().toISOString(),
    last_heartbeat_at: new Date().toISOString(),
    error_message: null
});

const heartbeat = async (discoveryJobId, updates = {}) => updateDiscoveryJob(discoveryJobId, {
    ...updates,
    last_heartbeat_at: new Date().toISOString()
});

const completeDiscoveryJob = async (discoveryJobId, status, updates = {}) => updateDiscoveryJob(discoveryJobId, {
    ...updates,
    status,
    completed_at: new Date().toISOString(),
    last_heartbeat_at: new Date().toISOString()
});

const findStaleProcessingJobs = async (staleAfterMinutes) => {
    const cutoff = new Date(Date.now() - staleAfterMinutes * 60 * 1000).toISOString();
    const { data, error } = await supabase
        .from('competition_discovery_jobs')
        .select('*')
        .eq('status', 'PROCESSING')
        .lt('last_heartbeat_at', cutoff);
    if (error) throw error;
    return data || [];
};

module.exports = {
    ACTIVE_STATES,
    TERMINAL_STATES,
    attachBossJobId,
    createDiscoveryJob,
    getDiscoveryJob,
    updateDiscoveryJob,
    markProcessing,
    heartbeat,
    completeDiscoveryJob,
    findStaleProcessingJobs
};
