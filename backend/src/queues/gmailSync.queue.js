// File Name: gmailSync.queue.js
// Purpose: Defines the "gmail-sync" job queue and a helper to enqueue jobs.
//
// Uses pg-boss backed by your existing Supabase PostgreSQL database.
// No Redis required.

const boss = require('../config/pgBossClient');

// ─── Job / Queue name constants ───────────────────────────────────────────────
const QUEUE_NAME  = 'gmail-sync';
const JOB_NAME    = 'sync-user-gmail';

// ─── Job options ──────────────────────────────────────────────────────────────
const JOB_OPTIONS = {
    retryLimit: Number(process.env.SYNC_JOB_RETRY_LIMIT || 3),
    retryDelay: Number(process.env.SYNC_JOB_RETRY_DELAY_SECONDS || 30),
    retryBackoff: true,
    expireInSeconds: Number(process.env.SYNC_JOB_EXPIRE_SECONDS || 60 * 60),
    keepUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

/**
 * addGmailSyncJob(data)
 *
 * Enqueues a Gmail sync job for a faculty member's competition sync.
 *
 * @param {object} data - Payload passed to the worker.
 *   Required fields:
 *     - syncJobId      {string}  UUID of the durable sync_jobs row
 *
 * @returns {Promise<string>} The pg-boss job ID.
 */
const addGmailSyncJob = async (data, delaySeconds = 0) => {
    const options = { ...JOB_OPTIONS };
    if (delaySeconds > 0) {
        options.startAfter = new Date(Date.now() + delaySeconds * 1000);
    }
    const jobId = await boss.send(QUEUE_NAME, { jobName: JOB_NAME, ...data }, options);
    console.log(`[GmailQueue] Job enqueued. ID: ${jobId} | SyncJob: ${data.syncJobId} | Delay: ${delaySeconds}s`);
    return jobId;
};

module.exports = { boss, QUEUE_NAME, JOB_NAME, addGmailSyncJob };
