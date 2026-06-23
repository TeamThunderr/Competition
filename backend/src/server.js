// File Name: server.js
// Purpose: Entry point to start the server
// Written for beginner developers

const { PORT } = require('./config/env');
const app = require('./app');
const boss = require('./config/pgBossClient');
const { registerGmailSyncWorker } = require('./workers/gmailSync.worker');

// ─── Start pg-boss queue then HTTP server ─────────────────────────────────────
// pg-boss needs to create/migrate its schema in Postgres on first run,
// so we await boss.start() before accepting HTTP traffic.

boss.start()
  .then(async () => {
    console.log('[PgBoss] Queue started. Schema ready in database.');

    // pg-boss v12: queues must be explicitly created before use
    const { QUEUE_NAME } = require('./queues/gmailSync.queue');
    await boss.createQueue(QUEUE_NAME);
    console.log(`[PgBoss] Queue "${QUEUE_NAME}" ready`);

    // Register background workers
    await registerGmailSyncWorker();
    console.log('[Server] Gmail sync worker registered');

    // Start HTTP server only after queue is ready
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[PgBoss] Failed to start queue:', err.message);
    console.error('         Make sure DATABASE_URL is set correctly in .env');
    // Start server anyway so the API still works even without the queue
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (queue unavailable)`);
    });
  });
// Force reload
