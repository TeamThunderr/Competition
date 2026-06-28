// File Name: gmailSync.worker.js
// Purpose: Consumes gmail-sync jobs from the pg-boss queue.
//
// pg-boss v10+ single-job handler: the callback receives ONE job at a time.
// The `batchSize` option causes the handler to receive an array — avoid it
// unless you explicitly want batch semantics. Use plain `boss.work(name, fn)`.

const boss       = require('../config/pgBossClient');
const { QUEUE_NAME } = require('../queues/gmailSync.queue');
const supabase   = require('../config/supabaseClient');

// Import the actual sync logic
const { performBatchSync } = require('../controllers/faculty/participation.controller');

// ─── Worker Registration ──────────────────────────────────────────────────────
const registerGmailSyncWorker = async () => {
    // pg-boss v10+: plain work() — handler is called with a SINGLE job object.
    await boss.work(QUEUE_NAME, async (job) => {
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

            // Run the sync logic in the background
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
            throw err; // pg-boss marks the job as failed and retries
        }
    });

    console.log('[GmailWorker] Worker registered and listening on queue:', QUEUE_NAME);
};

module.exports = { registerGmailSyncWorker };
