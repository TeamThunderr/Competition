const boss = require('../config/pgBossClient');
const supabase = require('../config/supabaseClient');
const { QUEUE_NAME, addCodingProfileSyncJob } = require('../queues/codingSync.queue');
const { syncProfileNow } = require('../services/coding/codingProfile.service');

const CONCURRENCY = Math.min(Math.max(Number(process.env.CODING_SYNC_WORKER_CONCURRENCY || 2), 1), Number(process.env.CODING_SYNC_WORKER_MAX_CONCURRENCY || 5));

const processJob = async (jobData) => {
  const { data: profile, error } = await supabase.from('student_coding_profiles').select('*').eq('id', jobData.studentCodingProfileId).single();
  if (error || !profile) throw new Error('Coding profile not found');
  await supabase.from('student_coding_profiles').update({ sync_status: 'PENDING_SYNC', last_sync_started_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', profile.id);
  await syncProfileNow(profile);
};

const registerCodingSyncWorker = async () => {
  await boss.work(QUEUE_NAME, { localConcurrency: CONCURRENCY, batchSize: 1, pollingIntervalSeconds: Number(process.env.CODING_SYNC_POLL_SECONDS || 5) }, async ([job]) => {
    return processJob(job.data);
  });
};

module.exports = { registerCodingSyncWorker };
