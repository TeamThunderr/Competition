// File Name: gmailSync.worker.js
// Purpose: Consumes gmail-sync jobs from the pg-boss queue.
//
// The worker calls the existing performBatchSync function from
// participation.controller.js — this is the same function the route
// called synchronously before. Now it runs in the background.
//
// With pg-boss, workers are simply boss.work() subscriptions.
// Concurrency is controlled by the teamSize option (3 jobs in parallel).

const boss       = require('../config/pgBossClient');
const { QUEUE_NAME } = require('../queues/gmailSync.queue');
const supabase   = require('../config/supabaseClient');

// Import the actual sync logic — same function used by the route, now run async
const { performBatchSync } = require('../controllers/faculty/participation.controller');

// ─── Worker Registration ──────────────────────────────────────────────────────
// Called from server.js after boss.start() resolves.
// Returns the pg-boss worker so it can be referenced/stopped if needed.

const registerGmailSyncWorker = async () => {
    await boss.work(
        QUEUE_NAME,
        { teamSize: 3, teamConcurrency: 3 }, // process up to 3 jobs concurrently
        async (job) => {
            const { competitionId, facultyId, departmentId, assignedSections } = job.data;

            console.log(`[GmailWorker] Processing job ${job.id} | Competition: ${competitionId} | Faculty: ${facultyId}`);

            try {
                // Fetch the competition record (performBatchSync needs the full object)
                const { data: competition, error: compError } = await supabase
                    .from('competitions')
                    .select('*')
                    .eq('id', competitionId)
                    .single();

                if (compError || !competition) {
                    throw new Error(`Competition not found: ${competitionId}`);
                }

                // Run the exact same sync logic the route previously ran synchronously
                const stats = await performBatchSync(
                    competition,
                    departmentId,
                    assignedSections,
                    facultyId
                );

                console.log(`[GmailWorker] Sync complete for competition ${competitionId}`, stats);

            } catch (err) {
                if (err.type === 'QUOTA_EXCEEDED') {
                    console.error(`[GmailWorker] Quota exceeded. Rescheduling job for ${err.delaySeconds}s...`);
                    const { addGmailSyncJob } = require('../queues/gmailSync.queue');
                    await addGmailSyncJob({
                        competitionId,
                        facultyId,
                        departmentId,
                        assignedSections
                    }, err.delaySeconds);
                    return; // Gracefully complete THIS job so pg-boss doesn't thrash
                }

                console.error(`[GmailWorker] Sync failed for competition ${competitionId}: ${err.message}`);
                // Re-throw so pg-boss marks the job as failed and schedules a retry
                throw err;
            }
        }
    );

    console.log('[GmailWorker] Worker registered and listening on queue:', QUEUE_NAME);
};

module.exports = { registerGmailSyncWorker };
