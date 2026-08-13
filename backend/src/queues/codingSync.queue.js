const boss = require('../config/pgBossClient');

const QUEUE_NAME = 'coding-sync';
const JOB_NAME = 'sync-coding-profile';
const JOB_OPTIONS = {
  retryLimit: Number(process.env.CODING_SYNC_JOB_RETRY_LIMIT || 3),
  retryDelay: Number(process.env.CODING_SYNC_JOB_RETRY_DELAY_SECONDS || 30),
  retryBackoff: true,
  expireInSeconds: Number(process.env.CODING_SYNC_JOB_EXPIRE_SECONDS || 3600),
  keepUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

const addCodingProfileSyncJob = async (data, delaySeconds = 0) => {
  const options = { ...JOB_OPTIONS };
  if (delaySeconds > 0) options.startAfter = new Date(Date.now() + delaySeconds * 1000);
  return boss.send(QUEUE_NAME, { jobName: JOB_NAME, ...data }, options);
};

module.exports = { QUEUE_NAME, JOB_NAME, addCodingProfileSyncJob };
