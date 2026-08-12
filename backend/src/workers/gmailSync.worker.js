// Consumes durable Gmail sync jobs from the pg-boss queue.

const boss = require('../config/pgBossClient');
const { QUEUE_NAME, addGmailSyncJob } = require('../queues/gmailSync.queue');
const supabase = require('../config/supabaseClient');
const syncJobService = require('../services/sync/syncJob.service');
const { performBatchSync } = require('../controllers/faculty/participation.controller');

const WORKER_CONCURRENCY = Math.min(
    Math.max(Number(process.env.SYNC_WORKER_CONCURRENCY || 2), 1),
    Number(process.env.SYNC_WORKER_MAX_CONCURRENCY || 5)
);
const MAX_RETRIES = Number(process.env.SYNC_JOB_MAX_RETRIES || 3);
const BASE_RETRY_DELAY_SECONDS = Number(process.env.SYNC_JOB_RETRY_DELAY_SECONDS || 30);
const HEARTBEAT_SECONDS = Number(process.env.SYNC_JOB_HEARTBEAT_SECONDS || 30);
const STALE_AFTER_MINUTES = Number(process.env.SYNC_JOB_STALE_AFTER_MINUTES || 15);

const logContext = (syncJob) =>
    `sync_job_id=${syncJob.id} competition_id=${syncJob.competition_id} requested_by=${syncJob.requested_by}`;

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

    await supabase
        .from('competitions')
        .update({
            is_syncing: true,
            sync_status: status === 'PAUSED_RATE_LIMIT' ? 'paused_quota' : 'queued_retry',
            sync_progress: `Sync retry scheduled in ${delaySeconds} seconds`,
            sync_error_message: err.message
        })
        .eq('id', syncJob.competition_id);

    const queueJobId = await addGmailSyncJob({ syncJobId: syncJob.id }, delaySeconds);
    await syncJobService.attachBossJobId(syncJob.id, queueJobId);
    console.warn(`[GmailWorker] Retry queued in ${delaySeconds}s | ${logContext(syncJob)} retry=${retryCount}`);
};

const processSyncJob = async (job) => {
    const syncJobId = job?.data?.syncJobId;
    if (!syncJobId) {
        throw new Error('Missing syncJobId in pg-boss job payload');
    }

    let syncJob = await syncJobService.getSyncJob(syncJobId);
    console.log(`[GmailWorker] Worker started | ${logContext(syncJob)} queue_job_id=${job.id}`);

    if (['COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED'].includes(syncJob.status)) {
        console.log(`[GmailWorker] Job already terminal; skipping | ${logContext(syncJob)} status=${syncJob.status}`);
        return;
    }

    await syncJobService.markProcessing(syncJob.id);
    syncJob = await syncJobService.getSyncJob(syncJob.id);

    const heartbeatTimer = setInterval(() => {
        syncJobService.heartbeat(syncJob.id).catch(err => {
            console.error(`[GmailWorker] Heartbeat failed | ${logContext(syncJob)} error=${err.message}`);
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
        console.log(`[GmailWorker] Job completed | ${logContext(syncJob)}`);
    } catch (err) {
        clearInterval(heartbeatTimer);
        syncJob = await syncJobService.getSyncJob(syncJob.id);

        if (isRetryableError(err) && (syncJob.retry_count || 0) < MAX_RETRIES) {
            await queueRetry(syncJob, err);
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
        console.error(`[GmailWorker] Job failed | ${logContext(syncJob)} error=${err.message}`);
    } finally {
        clearInterval(heartbeatTimer);
    }
};

const recoverStaleSyncJobs = async () => {
    const staleJobs = await syncJobService.findStaleProcessingJobs(STALE_AFTER_MINUTES);
    for (const syncJob of staleJobs) {
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

        const retryCount = (syncJob.retry_count || 0) + 1;
        await syncJobService.updateSyncJob(syncJob.id, {
            status: 'QUEUED',
            retry_count: retryCount,
            error_message: 'Recovered from stale PROCESSING heartbeat'
        });
        await supabase
            .from('competitions')
            .update({
                is_syncing: true,
                sync_status: 'queued_retry',
                sync_progress: 'Recovered stale sync job and queued retry'
            })
            .eq('id', syncJob.competition_id);
        const queueJobId = await addGmailSyncJob({ syncJobId: syncJob.id });
        await syncJobService.attachBossJobId(syncJob.id, queueJobId);
        console.warn(`[GmailWorker] Recovered stale job | ${logContext(syncJob)} retry=${retryCount}`);
    }
};

const registerGmailSyncWorker = async () => {
    await recoverStaleSyncJobs();

    await boss.work(
        QUEUE_NAME,
        {
            localConcurrency: WORKER_CONCURRENCY,
            batchSize: 1,
            pollingIntervalSeconds: Number(process.env.SYNC_WORKER_POLL_SECONDS || 5)
        },
        async ([job]) => processSyncJob(job)
    );

    console.log(`[GmailWorker] Worker registered on queue ${QUEUE_NAME} with concurrency=${WORKER_CONCURRENCY}`);
};

module.exports = { registerGmailSyncWorker, recoverStaleSyncJobs };
