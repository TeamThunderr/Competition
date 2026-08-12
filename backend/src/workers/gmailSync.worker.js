const boss = require('../config/pgBossClient');
const { QUEUE_NAME, addGmailSyncJob, addCompetitionDiscoveryJob } = require('../queues/gmailSync.queue');
const supabase = require('../config/supabaseClient');
const syncJobService = require('../services/sync/syncJob.service');
const { performBatchSync } = require('../controllers/faculty/participation.controller');
const discoveryJobService = require('../services/discovery/competitionDiscoveryJob.service');
const discoveryService = require('../services/discovery/competitionDiscovery.service');

const WORKER_CONCURRENCY = Math.min(
    Math.max(Number(process.env.SYNC_WORKER_CONCURRENCY || 2), 1),
    Number(process.env.SYNC_WORKER_MAX_CONCURRENCY || 5)
);
const MAX_RETRIES = Number(process.env.SYNC_JOB_MAX_RETRIES || 3);
const BASE_RETRY_DELAY_SECONDS = Number(process.env.SYNC_JOB_RETRY_DELAY_SECONDS || 30);
const HEARTBEAT_SECONDS = Number(process.env.SYNC_JOB_HEARTBEAT_SECONDS || 30);
const STALE_AFTER_MINUTES = Number(process.env.SYNC_JOB_STALE_AFTER_MINUTES || 15);

const logContext = (entity) =>
    entity.jobType === 'DISCOVERY'
        ? `discovery_job_id=${entity.id} mailbox_user_id=${entity.mailbox_user_id}`
        : `sync_job_id=${entity.id} competition_id=${entity.competition_id} requested_by=${entity.requested_by}`;

const isRetryableError = (err) => {
    const message = (err.message || '').toLowerCase();
    return err.type === 'QUOTA_EXCEEDED' ||
        message.includes('429') ||
        message.includes('quota') ||
        message.includes('timeout') ||
        message.includes('temporarily') ||
        message.includes('network') ||
        message.includes('econnreset') ||
        message.includes('etimedout') ||
        message.includes('failed to fetch emails from gmail');
};

const retryDelayFor = (retryCount, err) => {
    if (err.type === 'QUOTA_EXCEEDED' && Number(err.delaySeconds) > 0) {
        return Number(err.delaySeconds);
    }
    return BASE_RETRY_DELAY_SECONDS * Math.pow(2, Math.max(retryCount - 1, 0));
};

const loadCompetition = async (competitionId) => {
    const { data: competition, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single();
    if (error || !competition) throw new Error(`Competition not found: ${competitionId}`);
    return competition;
};

const queueRetry = async (syncJob, err) => {
    const retryCount = (syncJob.retry_count || 0) + 1;
    const delaySeconds = retryDelayFor(retryCount, err);
    const status = err.type === 'QUOTA_EXCEEDED' ? 'PAUSED_RATE_LIMIT' : 'QUEUED';

    await syncJobService.updateSyncJob(syncJob.id, {
        status,
        retry_count: retryCount,
        error_message: err.message,
        last_heartbeat_at: new Date().toISOString()
    });

    await supabase.from('competitions').update({
        is_syncing: true,
        sync_status: status === 'PAUSED_RATE_LIMIT' ? 'paused_quota' : 'queued_retry',
        sync_progress: `Sync retry scheduled in ${delaySeconds} seconds`,
        sync_error_message: err.message
    }).eq('id', syncJob.competition_id);

    const queueJobId = await addGmailSyncJob({ jobType: 'PARTICIPATION', syncJobId: syncJob.id }, delaySeconds);
    await syncJobService.attachBossJobId(syncJob.id, queueJobId);
    console.warn(`[GmailWorker] Retry queued in ${delaySeconds}s | ${logContext(syncJob)} retry=${retryCount}`);
};

const queueDiscoveryRetry = async (discoveryJob, err) => {
    const retryCount = (discoveryJob.retry_count || 0) + 1;
    const delaySeconds = retryDelayFor(retryCount, err);
    const status = err.type === 'QUOTA_EXCEEDED' ? 'PAUSED_RATE_LIMIT' : 'QUEUED';

    await discoveryJobService.updateDiscoveryJob(discoveryJob.id, {
        status,
        retry_count: retryCount,
        error_message: err.message,
        last_heartbeat_at: new Date().toISOString()
    });

    await supabase.from('competition_discovery_state').update({
        status: status === 'PAUSED_RATE_LIMIT' ? 'FAILED' : 'RUNNING',
        error_message: err.message,
        updated_at: new Date().toISOString()
    }).eq('mailbox_user_id', discoveryJob.mailbox_user_id);

    const queueJobId = await addCompetitionDiscoveryJob({ jobType: 'DISCOVERY', discoveryJobId: discoveryJob.id }, delaySeconds);
    await discoveryJobService.attachBossJobId(discoveryJob.id, queueJobId);
    console.warn(`[GmailWorker] Discovery retry queued in ${delaySeconds}s | ${logContext(discoveryJob)} retry=${retryCount}`);
};

const processParticipationJob = async (jobData) => {
    const syncJobId = jobData.syncJobId;
    const syncJob = await syncJobService.getSyncJob(syncJobId);

    console.log(`[GmailWorker] Worker started | ${logContext({ ...syncJob, jobType: 'PARTICIPATION' })} queue_job_id=${jobData.pgBossJobId || 'n/a'}`);

    if (['COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED'].includes(syncJob.status)) {
        return;
    }

    await syncJobService.markProcessing(syncJob.id);

    const heartbeatTimer = setInterval(() => {
        syncJobService.heartbeat(syncJob.id).catch(err => {
            console.error(`[GmailWorker] Heartbeat failed | ${logContext({ ...syncJob, jobType: 'PARTICIPATION' })} error=${err.message}`);
        });
    }, HEARTBEAT_SECONDS * 1000);

    try {
        const competition = await loadCompetition(syncJob.competition_id);
        await performBatchSync(
            competition,
            syncJob.scope_department_id,
            syncJob.scope_sections,
            syncJob.requested_by,
            { syncJobId: syncJob.id }
        );
        console.log(`[GmailWorker] Job completed | ${logContext({ ...syncJob, jobType: 'PARTICIPATION' })}`);
    } catch (err) {
        if (isRetryableError(err) && (syncJob.retry_count || 0) < MAX_RETRIES) {
            await queueRetry(syncJob, err);
            clearInterval(heartbeatTimer);
            return;
        }

        await syncJobService.completeSyncJob(syncJob.id, 'FAILED', {
            error_message: err.message,
            error_count: (syncJob.error_count || 0) + 1
        });
        await syncJobService.clearCompetitionSyncState(syncJob.competition_id, {
            sync_status: 'failed',
            sync_progress: `Sync failed: ${err.message}`,
            sync_error_message: err.message
        });
        console.error(`[GmailWorker] Job failed | ${logContext({ ...syncJob, jobType: 'PARTICIPATION' })} error=${err.message}`);
    } finally {
        clearInterval(heartbeatTimer);
    }
};

const processDiscoveryJob = async (jobData) => {
    const discoveryJobId = jobData.discoveryJobId;
    const discoveryJob = await discoveryJobService.getDiscoveryJob(discoveryJobId);

    console.log(`[GmailWorker] Worker started | ${logContext({ ...discoveryJob, jobType: 'DISCOVERY' })} queue_job_id=${jobData.pgBossJobId || 'n/a'}`);

    if (['COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED'].includes(discoveryJob.status)) {
        return;
    }

    await discoveryJobService.markProcessing(discoveryJob.id);

    const heartbeatTimer = setInterval(() => {
        discoveryJobService.heartbeat(discoveryJob.id).catch(err => {
            console.error(`[GmailWorker] Discovery heartbeat failed | ${logContext({ ...discoveryJob, jobType: 'DISCOVERY' })} error=${err.message}`);
        });
    }, HEARTBEAT_SECONDS * 1000);

    try {
        const result = await discoveryService.processDiscoveryJob({
            discoveryJobId: discoveryJob.id,
            requestedBy: discoveryJob.requested_by,
            heartbeat: (updates) => discoveryJobService.heartbeat(discoveryJob.id, updates),
            complete: (status, updates) => discoveryJobService.completeDiscoveryJob(discoveryJob.id, status, updates),
            updateJob: (updates) => discoveryJobService.updateDiscoveryJob(discoveryJob.id, updates)
        });
        console.log(`[GmailWorker] Discovery job completed | ${logContext({ ...discoveryJob, jobType: 'DISCOVERY' })}`, result);
    } catch (err) {
        if (isRetryableError(err) && (discoveryJob.retry_count || 0) < MAX_RETRIES) {
            await queueDiscoveryRetry(discoveryJob, err);
            clearInterval(heartbeatTimer);
            return;
        }

        await discoveryJobService.completeDiscoveryJob(discoveryJob.id, 'FAILED', {
            error_message: err.message,
            error_count: (discoveryJob.error_count || 0) + 1
        });
        await supabase.from('competition_discovery_state').update({
            status: 'FAILED',
            error_message: err.message,
            updated_at: new Date().toISOString()
        }).eq('mailbox_user_id', discoveryJob.mailbox_user_id);
        console.error(`[GmailWorker] Discovery job failed | ${logContext({ ...discoveryJob, jobType: 'DISCOVERY' })} error=${err.message}`);
    } finally {
        clearInterval(heartbeatTimer);
    }
};

const recoverStaleJobs = async () => {
    const staleParticipation = await syncJobService.findStaleProcessingJobs(STALE_AFTER_MINUTES);
    for (const syncJob of staleParticipation) {
        if ((syncJob.retry_count || 0) >= MAX_RETRIES) {
            await syncJobService.completeSyncJob(syncJob.id, 'FAILED', {
                error_message: 'Job heartbeat became stale and retry limit was reached'
            });
            await syncJobService.clearCompetitionSyncState(syncJob.competition_id, {
                sync_status: 'failed',
                sync_progress: 'Sync failed after stale worker recovery',
                sync_error_message: 'Job heartbeat became stale and retry limit was reached'
            });
            continue;
        }
        const queueJobId = await addGmailSyncJob({ jobType: 'PARTICIPATION', syncJobId: syncJob.id });
        await syncJobService.attachBossJobId(syncJob.id, queueJobId);
    }

    const staleDiscovery = await discoveryJobService.findStaleProcessingJobs(STALE_AFTER_MINUTES);
    for (const discoveryJob of staleDiscovery) {
        if ((discoveryJob.retry_count || 0) >= MAX_RETRIES) {
            await discoveryJobService.completeDiscoveryJob(discoveryJob.id, 'FAILED', {
                error_message: 'Discovery job heartbeat became stale and retry limit was reached'
            });
            await supabase.from('competition_discovery_state').update({
                status: 'FAILED',
                error_message: 'Discovery job heartbeat became stale and retry limit was reached',
                updated_at: new Date().toISOString()
            }).eq('mailbox_user_id', discoveryJob.mailbox_user_id);
            continue;
        }
        const queueJobId = await addCompetitionDiscoveryJob({ jobType: 'DISCOVERY', discoveryJobId: discoveryJob.id });
        await discoveryJobService.attachBossJobId(discoveryJob.id, queueJobId);
    }
};

const registerGmailSyncWorker = async () => {
    await recoverStaleJobs();

    await boss.work(
        QUEUE_NAME,
        {
            localConcurrency: WORKER_CONCURRENCY,
            batchSize: 1,
            pollingIntervalSeconds: Number(process.env.SYNC_WORKER_POLL_SECONDS || 5)
        },
        async ([job]) => {
            const jobType = job.data?.jobType || 'PARTICIPATION';
            if (jobType === 'DISCOVERY') {
                return processDiscoveryJob(job.data);
            }
            return processParticipationJob(job.data);
        }
    );

    console.log(`[GmailWorker] Worker registered on queue ${QUEUE_NAME} with concurrency=${WORKER_CONCURRENCY}`);
};

module.exports = { registerGmailSyncWorker, recoverStaleJobs };
