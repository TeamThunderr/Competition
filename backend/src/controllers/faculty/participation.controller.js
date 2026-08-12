
const supabase = require('../../config/supabaseClient');
const gmailService = require('../../services/gmail/gmail.service');
const { google } = require('googleapis');
const { addGmailSyncJob } = require('../../queues/gmailSync.queue');
const syncJobService = require('../../services/sync/syncJob.service');
const { buildXlsxBuffer } = require('../../utils/exportHelper');

// Helper to get OAuth2 Client with Refresh Token
const getAuthClient = (refreshToken) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000';

    if (!clientId || !clientSecret) {
        throw new Error("Google Client ID/Secret missing in env");
    }

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    return oAuth2Client;
};

// Helper to sync a single student for a competition
// SYNC Single Competition — now enqueues a background job instead of blocking
const syncCompetition = async (req, res) => {
    try {
        const { id: competitionId } = req.params;
        const { id: facultyId, department_id, assigned_sections } = req.user;

        console.log(`[Sync] Queue request by Faculty ${facultyId} for Comp ${competitionId}`);

        const { data: competition, error: compErr } = await supabase
            .from('competitions')
            .select('id, title, is_syncing')
            .eq('id', competitionId)
            .single();

        if (compErr || !competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }

        const job = await syncJobService.createSyncJob({
            competitionId,
            requestedBy: facultyId,
            departmentId: department_id,
            assignedSections: assigned_sections
        });

        if (job.alreadyRunning) {
            return res.status(409).json({
                success: false,
                error: 'Sync already in progress',
                message: job.message,
                jobId: job.jobId
            });
        }

        const bossJobId = await addGmailSyncJob({ syncJobId: job.jobId });
        await syncJobService.attachBossJobId(job.jobId, bossJobId);

        console.log(`[Sync] Job created and queued | sync_job_id=${job.jobId} competition_id=${competitionId} requested_by=${facultyId}`);

        return res.status(202).json({
            success: true,
            message: 'Sync started',
            competitionId,
            jobId: job.jobId,
            queueJobId: bossJobId
        });

    } catch (err) {
        console.error('[Sync] Error:', err);
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
    }
};

// SYNC ALL Active Competitions — queues each sync as a durable background job
const syncAllCompetitions = async (req, res) => {
    try {
        const { id: facultyId, department_id, assigned_sections } = req.user;
        console.log(`[SyncAll] Queue request by Faculty ${facultyId}`);

        const now = new Date().toISOString();
        const { data: competitions, error: compError } = await supabase
            .from('competitions')
            .select('*')
            .gte('registration_deadline', now);

        if (compError) {
            console.error('[SyncAll] DB Error Fetching Competitions:', compError.message);
            return res.status(500).json({ error: 'Database Error: Competitions' });
        }

        const queued = [];
        const skipped = [];

        for (const comp of competitions || []) {
            try {
                const job = await syncJobService.createSyncJob({
                    competitionId: comp.id,
                    requestedBy: facultyId,
                    departmentId: department_id,
                    assignedSections: assigned_sections
                });

                if (job.alreadyRunning) {
                    skipped.push({ competitionId: comp.id, jobId: job.jobId, reason: job.message });
                    continue;
                }

                const bossJobId = await addGmailSyncJob({ syncJobId: job.jobId });
                await syncJobService.attachBossJobId(job.jobId, bossJobId);
                queued.push({ competitionId: comp.id, jobId: job.jobId, queueJobId: bossJobId });
                console.log(`[SyncAll] Job queued | sync_job_id=${job.jobId} competition_id=${comp.id} requested_by=${facultyId}`);
            } catch (err) {
                skipped.push({ competitionId: comp.id, reason: err.message });
            }
        }

        return res.status(202).json({
            success: true,
            message: 'Gmail sync jobs queued for active competitions',
            totalQueued: queued.length,
            totalSkipped: skipped.length,
            jobs: queued,
            skipped
        });

    } catch (err) {
        console.error('[SyncAll] Critical Error:', err);
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
    }
};

const getSyncJobStatus = async (req, res) => {
    try {
        const { id: facultyId, department_id } = req.user;
        const { jobId } = req.params;

        const job = await syncJobService.getSyncJob(jobId);
        const canView = job.requested_by === facultyId || job.scope_department_id === department_id;
        if (!canView) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        return res.status(200).json({
            success: true,
            data: {
                jobId: job.id,
                competitionId: job.competition_id,
                status: job.status,
                startedAt: job.started_at,
                completedAt: job.completed_at,
                totalStudents: job.total_students,
                studentsProcessed: job.students_processed,
                emailsFound: job.emails_found,
                emailsProcessed: job.emails_processed,
                registrationsUpdated: job.registrations_updated,
                errorCount: job.error_count,
                errorMessage: job.error_message,
                retryCount: job.retry_count
            }
        });
    } catch (err) {
        console.error('[SyncJobStatus] Error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// EXPORT Report - Reading from REGISTRATIONS (Source of Truth)
const exportParticipationStats = async (req, res) => {
    try {
        const { id: facultyId, department_id, assigned_sections } = req.user;

        const facultySectionsParsed = (assigned_sections || []).map(s => {
            const parts = s.split('-');
            return parts.length > 1 ? parts[parts.length - 1].trim() : s.trim();
        });

        const { data: users, error: userError } = await supabase.from('users').select('id, full_name, email, registration_no, section').eq('department_id', department_id).eq('role', 'STUDENT');
        if (userError) throw userError;

        const myStudents = users.filter(u => facultySectionsParsed.includes(u.section?.trim().toUpperCase()));
        const myStudentIds = myStudents.map(u => u.id);

        if (myStudentIds.length === 0) return res.status(200).send("No students found.");

        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select(`
                status, source, verified, registered_at,
                competitions (title, platform),
                user_id
            `)
            .in('user_id', myStudentIds);

        if (regError) throw regError;

        const headers = ['Student Name', 'Reg No', 'Section', 'Competition', 'Platform', 'Status', 'Source', 'Verified'];
        
        const xlsxData = registrations.reduce((acc, r) => {
            const student = myStudents.find(s => s.id === r.user_id);
            if (student) {
                acc.push({
                    'Student Name': student.full_name || 'N/A',
                    'Reg No': student.registration_no || 'N/A',
                    'Section': student.section || 'N/A',
                    'Competition': r.competitions?.title || 'N/A',
                    'Platform': r.competitions?.platform || 'N/A',
                    'Status': r.status || 'N/A',
                    'Source': r.source || 'N/A',
                    'Verified': r.verified ? 'Yes' : 'No'
                });
            }
            return acc;
        }, []);

        const buffer = buildXlsxBuffer(xlsxData, headers, 'Report');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="registration_report_${Date.now()}.xlsx"`);
        res.status(200).send(buffer);

    } catch (err) {
        console.error('[Export] Error:', err);
        res.status(500).json({ error: 'Export failed' });
    }
};

// Shared Logic for Batch Sync (Using Registrations Table ONLY)
async function performBatchSync(competition, departmentId, assignedVersion, facultyId = null, options = {}) {
    const syncJobId = options.syncJobId || null;
    const studentChunkSize = Number(process.env.GMAIL_STUDENT_CHUNK_SIZE || 25);
    const geminiBatchSize = Math.min(
        Math.max(Number(process.env.GEMINI_BATCH_SIZE || 25), 1),
        Number(process.env.GEMINI_MAX_BATCH_SIZE || 50)
    );
    const progress = async (message, jobUpdates = {}) => {
        await supabase.from('competitions').update({ sync_progress: message }).eq('id', competition.id);
        if (syncJobId) {
            await syncJobService.heartbeat(syncJobId, jobUpdates);
        }
    };

    let syncFrom;
    if (competition.last_synced_at) {
        // If it was already synced, start from the last sync time minus a 2-day buffer (in case of delayed emails)
        const baseDate = new Date(competition.last_synced_at);
        baseDate.setDate(baseDate.getDate() - 2); 
        syncFrom = baseDate.toISOString();
    } else {
        // First sync ever: use uploaded_at minus 14 days to catch early registrations
        const baseDate = new Date(competition.uploaded_at || competition.created_at || Date.now());
        baseDate.setDate(baseDate.getDate() - 14); // 14-day lookback buffer
        syncFrom = baseDate.toISOString();
    }
    const syncTo = new Date().toISOString();

    const stats = { processed: 0, detected: 0, errors: 0, skipped: 0, emailsFound: 0, studentsProcessed: 0 };
    const logs = { processed: [], detected: [], errors: [], skipped: [] };

    try {
        // 1. Acquire Sync Lock
        const { error: lockError } = await supabase
            .from('competitions')
            .update({
                is_syncing: true,
                sync_started_by: facultyId,
                last_sync_from: syncFrom,
                sync_status: 'running',
                sync_progress: 'Initializing sync...'
            })
            .eq('id', competition.id);

        if (lockError) throw new Error('Failed to acquire sync lock');

        // 2. Fetch Students
        const facultySectionsParsed = (assignedVersion || []).map(s => {
            const parts = s.split('-');
            return parts.length > 1 ? parts[parts.length - 1].trim().toUpperCase() : s.trim().toUpperCase();
        });

        const isClosed = competition.registration_deadline && new Date(competition.registration_deadline) < new Date();
        let targetStudents = [];

        if (isClosed) {
            const { data: regStudents } = await supabase
                .from('registrations')
                .select('user_id, users!inner(id, email, section, google_refresh_token)')
                .eq('competition_id', competition.id)
                .eq('users.department_id', departmentId)
                .eq('users.role', 'STUDENT');

            targetStudents = (regStudents || []).map(r => r.users).filter(s => {
                return facultySectionsParsed.includes(s.section ? s.section.trim().toUpperCase() : '');
            });
        } else {
            const { data: students } = await supabase
                .from('users')
                .select('id, email, section, google_refresh_token')
                .eq('department_id', departmentId)
                .eq('role', 'STUDENT');

            targetStudents = (students || []).filter(s => {
                return facultySectionsParsed.includes(s.section ? s.section.trim().toUpperCase() : '');
            });
        }

        const studentsToSync = targetStudents.filter(s => !!s.google_refresh_token);
        if (syncJobId) {
            await syncJobService.heartbeat(syncJobId, {
                total_students: studentsToSync.length,
                students_processed: 0,
                emails_found: 0,
                emails_processed: 0,
                registrations_updated: 0,
                error_count: 0
            });
        }

        // 3. PHASE 1: INGESTION
        console.log(`[BatchSync] Phase 1: Ingesting emails for ${studentsToSync.length} students... | sync_job_id=${syncJobId || 'legacy'} competition_id=${competition.id} requested_by=${facultyId || 'unknown'}`);
        let currentStudent = 0;
        for (const student of studentsToSync) {
            currentStudent++;
            if ((currentStudent - 1) % studentChunkSize === 0) {
                console.log(`[BatchSync] Gmail chunk started | sync_job_id=${syncJobId || 'legacy'} competition_id=${competition.id} requested_by=${facultyId || 'unknown'} student=${currentStudent}/${studentsToSync.length}`);
            }
            try {
                const found = await gmailService.ingestStudentEmails(student.id, competition, syncFrom);
                stats.emailsFound += found || 0;
            } catch (err) {
                console.error(`[BatchSync] Ingestion failed for ${student.email}:`, err.message);
                stats.errors++;
            }
            stats.studentsProcessed++;
            if (currentStudent % 5 === 0 || currentStudent === studentsToSync.length) {
                await progress(`Ingesting emails from Gmail: Student ${currentStudent} of ${studentsToSync.length}`, {
                    total_students: studentsToSync.length,
                    students_processed: currentStudent,
                    emails_found: stats.emailsFound,
                    error_count: stats.errors
                });
            }
            if (currentStudent % studentChunkSize === 0 || currentStudent === studentsToSync.length) {
                console.log(`[BatchSync] Gmail chunk completed | sync_job_id=${syncJobId || 'legacy'} competition_id=${competition.id} requested_by=${facultyId || 'unknown'} student=${currentStudent}/${studentsToSync.length}`);
            }
        }

        // 4. PHASE 2: BATCH PARSING
        console.log(`[BatchSync] Phase 2: Processing emails in batches of ${geminiBatchSize}... | sync_job_id=${syncJobId || 'legacy'} competition_id=${competition.id} requested_by=${facultyId || 'unknown'}`);
        
        const { data: pendingEmails, error: fetchErr } = await supabase
            .from('email_ingestion_buffer')
            .select('*')
            .eq('competition_id', competition.id)
            .eq('status', 'pending');

        if (fetchErr) throw fetchErr;

        const emailBatches = [];
        for (let i = 0; i < (pendingEmails || []).length; i += geminiBatchSize) {
            emailBatches.push(pendingEmails.slice(i, i + geminiBatchSize));
        }

        const { parseEmailBatch } = require('../../services/gmail/geminiParser.service');

        let processedBatches = 0;
        const totalBatches = emailBatches.length;
        const totalEmails = (pendingEmails || []).length;

        for (const batch of emailBatches) {
            processedBatches++;
            await progress(`AI Analyzing emails: Batch ${processedBatches} of ${totalBatches} (${totalEmails} total emails)`, {
                emails_found: stats.emailsFound,
                emails_processed: stats.processed,
                registrations_updated: stats.detected,
                error_count: stats.errors
            });

            try {
                console.log(`[BatchSync] Gemini batch started | sync_job_id=${syncJobId || 'legacy'} competition_id=${competition.id} requested_by=${facultyId || 'unknown'} batch=${processedBatches}/${totalBatches}`);
                const results = await parseEmailBatch(batch, competition.title);

                if (results && Array.isArray(results)) {
                    for (const res of results) {
                        const emailRecord = batch.find(e => e.gmail_message_id === res.id);
                        if (!emailRecord) continue;
                        
                        // Update buffer
                        await supabase
                            .from('email_ingestion_buffer')
                            .update({ status: 'processed', processed_at: new Date().toISOString() })
                            .eq('id', emailRecord.id);

                        if (res.is_competition_related && res.status && res.status !== 'UNKNOWN') {
                            stats.detected++;
                            
                            const registrationUpsertData = {
                                user_id: emailRecord.user_id,
                                competition_id: competition.id,
                                source: 'AUTO_GMAIL',
                                verified: true,
                                registered_at: new Date().toISOString(),
                                gmail_message_id: res.id,
                                matched_keyword: 'gemini_batch',
                                confidence_score: res.confidence === 'high' ? 90 : (res.confidence === 'medium' ? 60 : 30),
                                last_synced_at: syncTo,
                                remarks: `[Gemini ${res.confidence}] Match: ${res.status}. Breakdown: ${(res.reasoning || []).join(' | ')}`
                            };

                            await supabase.from('registrations').upsert(registrationUpsertData, { onConflict: 'user_id, competition_id' });

                            if (['SHORTLISTED', 'QUALIFIED', 'WON', 'WINNER'].includes(res.status)) {
                                const isWon = ['WON', 'WINNER'].includes(res.status);
                                await supabase.from('competition_status').upsert({
                                    user_id: emailRecord.user_id,
                                    competition_id: competition.id,
                                    is_shortlisted: true,
                                    is_winner: isWon,
                                    updated_at: new Date()
                                }, { onConflict: 'user_id, competition_id' });

                                if (isWon) {
                                    // Also update registrations table for legacy/student controller logic
                                    await supabase.from('registrations').update({
                                        won_status: 'WON'
                                    }).eq('user_id', emailRecord.user_id).eq('competition_id', competition.id);
                                }
                            }
                        }
                        
                        stats.processed++;
                    }
                }
                console.log(`[BatchSync] Gemini batch completed | sync_job_id=${syncJobId || 'legacy'} competition_id=${competition.id} requested_by=${facultyId || 'unknown'} batch=${processedBatches}/${totalBatches}`);
            } catch (batchErr) {
                // If it's a QUOTA EXCEEDED, we must abort the sync and throw so pg-boss reschedules
                if (batchErr.type === 'QUOTA_EXCEEDED') {
                    console.error('[BatchSync] Quota Exceeded. Aborting current batch process to reschedule.');
                    throw batchErr;
                }

                console.error('[BatchSync] Error processing batch:', batchErr.message);
                stats.errors += batch.length;
                
                // Mark batch as error in buffer
                const batchIds = batch.map(e => e.id);
                await supabase
                    .from('email_ingestion_buffer')
                    .update({ status: 'error', error_message: batchErr.message })
                    .in('id', batchIds);
            }
        }

        // 5. Update Competition with Success Status
        const syncStatus = stats.errors > 0 ? (stats.detected > 0 ? 'partial' : 'failed') : 'success';
        const jobStatus = stats.errors > 0 ? (stats.detected > 0 || stats.processed > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED') : 'COMPLETED';
        await supabase
            .from('competitions')
            .update({
                is_syncing: false,
                last_synced_at: syncTo,
                last_sync_from: syncFrom,
                last_sync_to: syncTo,
                sync_status: syncStatus,
                sync_progress: `Sync completed (${stats.detected} detected, ${stats.processed} processed)`
            })
            .eq('id', competition.id);

        console.log(`[BatchSync] Completed. Status: ${syncStatus}`, stats);
        if (syncJobId) {
            await syncJobService.completeSyncJob(syncJobId, jobStatus, {
                students_processed: stats.studentsProcessed,
                emails_found: stats.emailsFound,
                emails_processed: stats.processed,
                competitions_updated: stats.detected > 0 ? 1 : 0,
                registrations_updated: stats.detected,
                error_count: stats.errors,
                error_message: stats.errors > 0 ? `Completed with ${stats.errors} errors` : null
            });
        }
        return { stats, logs };

    } catch (error) {
        if (error.type === 'QUOTA_EXCEEDED') {
            await supabase
                .from('competitions')
                .update({ sync_status: 'paused_quota', sync_error_message: error.message })
                .eq('id', competition.id);
            if (syncJobId) {
                await syncJobService.updateSyncJob(syncJobId, {
                    status: 'PAUSED_RATE_LIMIT',
                    error_message: error.message,
                    error_count: stats.errors
                });
            }
            throw error; // pg-boss catches this
        }

        await supabase
            .from('competitions')
            .update({
                is_syncing: false,
                sync_status: 'failed',
                sync_error_message: error.message
            })
            .eq('id', competition.id);
        if (syncJobId) {
            await syncJobService.completeSyncJob(syncJobId, 'FAILED', {
                students_processed: stats.studentsProcessed,
                emails_found: stats.emailsFound,
                emails_processed: stats.processed,
                registrations_updated: stats.detected,
                error_count: stats.errors + 1,
                error_message: error.message
            });
        }
        throw error;
    }
}

module.exports = { syncCompetition, syncAllCompetitions, getSyncJobStatus, exportParticipationStats, performBatchSync };
