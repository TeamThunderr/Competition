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
    retryLimit:   3,
    retryDelay:   5,         // seconds before first retry
    retryBackoff: true,      // exponential: 5s, 10s, 20s
    expireInSeconds: 60 * 5, // job is cancelled if not picked up within 5 min
    keepUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // keep records 7 days
};

/**
 * addGmailSyncJob(data)
 *
 * Enqueues a Gmail sync job for a faculty member's competition sync.
 *
 * @param {object} data - Payload passed to the worker.
 *   Required fields:
 *     - competitionId  {string}  UUID of the competition to sync
 *     - facultyId      {string}  UUID of the faculty user triggering the sync
 *     - departmentId   {string}  Faculty's department_id
 *     - assignedSections {Array} Faculty's assigned section list
 *
 * @returns {Promise<string>} The pg-boss job ID.
 */
const addGmailSyncJob = async (data, delaySeconds = 0) => {
    const options = { ...JOB_OPTIONS };
    if (delaySeconds > 0) {
        options.startAfter = delaySeconds;
    }
    const jobId = await boss.send(QUEUE_NAME, { jobName: JOB_NAME, ...data }, options);
    console.log(`[GmailQueue] Job enqueued. ID: ${jobId} | Competition: ${data.competitionId} | Delay: ${delaySeconds}s`);
    return jobId;
};

module.exports = { boss, QUEUE_NAME, JOB_NAME, addGmailSyncJob };
