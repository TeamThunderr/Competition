// File Name: pgBossClient.js
// Purpose: Singleton pg-boss instance shared across the application.
//
// pg-boss is a PostgreSQL-backed job queue — it uses the same Supabase
// Postgres database, so no Redis or any extra infrastructure is needed.
//
// The boss instance is created once and exported. Callers must await
// boss.start() before enqueueing or consuming jobs.

// pg-boss v12 exports a named { PgBoss } — not a default export.
const { PgBoss } = require('pg-boss');
const dotenv = require('dotenv');

dotenv.config();

// pg-boss accepts either a connection string or individual parameters.
// Supabase exposes a direct Postgres connection string via DATABASE_URL,
// or you can build one from the individual env vars below.
// pg-boss requires a DIRECT connection (not pooler) for LISTEN/NOTIFY to work.
// The session pooler (pooler.supabase.com) does NOT support LISTEN/NOTIFY,
// which means workers will never pick up jobs. Always use the direct host.
const connectionString =
    process.env.DATABASE_URL ||
    process.env.DIRECT_DATABASE_URL ||
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || 'db.' + (process.env.SUPABASE_URL || '').replace('https://', '').replace('.supabase.co', '') + '.supabase.co'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`;

const boss = new PgBoss({
    connectionString,
    max: 4, // Limit connections to prevent Supabase EMAXCONNSESSION
    // Retain job records for observability
    deleteAfterDays: 7,       // auto-purge jobs older than 7 days
    archiveCompletedAfterSeconds: 60 * 60 * 24, // archive after 24h
    monitorStateIntervalSeconds: 30,
    // Retry configuration defaults (overridable per job)
    retryLimit: 3,
    retryDelay: 5,            // seconds
    retryBackoff: true,       // exponential backoff
});

boss.on('error', (err) => {
    console.error('[PgBoss] Queue error:', err.message);
});

boss.on('monitor-states', (states) => {
    // Logs periodic health snapshot — set to debug level to reduce noise
    if (process.env.NODE_ENV !== 'production') {
        console.log('[PgBoss] State snapshot:', JSON.stringify(states));
    }
});

module.exports = boss;
