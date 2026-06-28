
const supabase = require('../../config/supabaseClient');
const gmailService = require('../../services/gmail/gmail.service');
const { google } = require('googleapis');
const { addGmailSyncJob } = require('../../queues/gmailSync.queue');
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

        console.log(`[Sync] Background request by Faculty ${facultyId} for Comp ${competitionId}`);

        // Verify competition exists
        const { data: competition, error: compErr } = await supabase
            .from('competitions')
            .select('id, title, is_syncing')
            .eq('id', competitionId)
            .single();

        if (compErr || !competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }

        // Prevent duplicate runs while a sync is already running
        if (competition.is_syncing) {
            return res.status(409).json({
                error: 'Sync already in progress',
                message: 'Another sync is currently running for this competition.'
            });
        }

        // Lock immediately so the frontend disables the button right away
        await supabase.from('competitions').update({ 
            is_syncing: true, 
            sync_status: 'running', 
            sync_progress: 'Initializing sync...'
        }).eq('id', competitionId);

        // Fetch the full competition record for performBatchSync
        const { data: fullComp } = await supabase.from('competitions').select('*').eq('id', competitionId).single();

        // Run sync in the background — respond immediately
        setImmediate(async () => {
            try {
                await performBatchSync(fullComp, department_id, assigned_sections, facultyId);
                console.log(`[Sync] Background sync complete for ${competitionId}`);
            } catch (err) {
                console.error(`[Sync] Background sync failed for ${competitionId}:`, err.message);
                await supabase.from('competitions').update({ 
                    is_syncing: false, sync_status: 'failed', sync_progress: 'Sync failed: ' + err.message 
                }).eq('id', competitionId);
            }
        });

        // Return 202 immediately
        return res.status(202).json({
            message: 'Gmail sync started in background',
            competitionId,
        });

    } catch (err) {
        console.error('[Sync] Error:', err);
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
    }
};

// SYNC ALL Active Competitions — runs each in background
const syncAllCompetitions = async (req, res) => {
    try {
        const { id: facultyId, department_id, assigned_sections } = req.user;
        console.log(`[SyncAll] Background request by Faculty ${facultyId}`);

        const now = new Date().toISOString();
        const { data: competitions, error: compError } = await supabase
            .from('competitions')
            .select('*')
            .gte('registration_deadline', now);

        if (compError) {
            console.error('[SyncAll] DB Error Fetching Competitions:', compError.message);
            return res.status(500).json({ error: 'Database Error: Competitions' });
        }

        // Filter out competitions that are already syncing
        const compsToSync = (competitions || []).filter(c => !c.is_syncing);

        if (compsToSync.length > 0) {
            const compIds = compsToSync.map(c => c.id);
            // Lock immediately so the frontend reflects the change
            await supabase.from('competitions').update({ 
                is_syncing: true, 
                sync_status: 'running', 
                sync_progress: 'Initializing sync...'
            }).in('id', compIds);
        }

        console.log(`[SyncAll] Starting ${compsToSync.length} background sync jobs.`);

        // Run each in background
        compsToSync.forEach((comp) => {
            setImmediate(async () => {
                try {
                    await performBatchSync(comp, department_id, assigned_sections, facultyId);
                    console.log(`[SyncAll] Sync complete for ${comp.id}`);
                } catch (err) {
                    console.error(`[SyncAll] Sync failed for ${comp.id}:`, err.message);
                    await supabase.from('competitions').update({ 
                        is_syncing: false, sync_status: 'failed', sync_progress: 'Sync failed: ' + err.message
                    }).eq('id', comp.id);
                }
            });
        });

        return res.status(202).json({
            message: 'Gmail sync started in background for all active competitions',
            totalStarted: compsToSync.length,
        });

    } catch (err) {
        console.error('[SyncAll] Critical Error:', err);
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
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
async function performBatchSync(competition, departmentId, assignedVersion, facultyId = null) {
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

    const stats = { processed: 0, detected: 0, errors: 0, skipped: 0 };
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

        // 3. PHASE 1: INGESTION
        console.log(`[BatchSync] Phase 1: Ingesting emails for ${studentsToSync.length} students...`);
        let currentStudent = 0;
        for (const student of studentsToSync) {
            currentStudent++;
            // Update progress every 5 students or if it's the last one
            if (currentStudent % 5 === 0 || currentStudent === studentsToSync.length) {
                await supabase.from('competitions').update({
                    sync_progress: `Ingesting emails from Gmail: Student ${currentStudent} of ${studentsToSync.length}`
                }).eq('id', competition.id);
            }
            try {
                await gmailService.ingestStudentEmails(student.id, competition, syncFrom);
            } catch (err) {
                console.error(`[BatchSync] Ingestion failed for ${student.email}:`, err.message);
                stats.errors++;
            }
        }

        // 4. PHASE 2: BATCH PARSING
        console.log(`[BatchSync] Phase 2: Processing emails in batches of 50...`);
        
        const { data: pendingEmails, error: fetchErr } = await supabase
            .from('email_ingestion_buffer')
            .select('*')
            .eq('competition_id', competition.id)
            .eq('status', 'pending');

        if (fetchErr) throw fetchErr;

        const emailBatches = [];
        for (let i = 0; i < (pendingEmails || []).length; i += 50) {
            emailBatches.push(pendingEmails.slice(i, i + 50));
        }

        const { parseEmailBatch } = require('../../services/gmail/geminiParser.service');

        let processedBatches = 0;
        const totalBatches = emailBatches.length;
        const totalEmails = (pendingEmails || []).length;

        for (const batch of emailBatches) {
            processedBatches++;
            await supabase.from('competitions').update({
                sync_progress: `AI Analyzing emails: Batch ${processedBatches} of ${totalBatches} (${totalEmails} total emails)`
            }).eq('id', competition.id);

            try {
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
                        } else {
                            stats.processed++;
                        }
                    }
                }
            } catch (batchErr) {
                // If it's a QUOTA EXCEEDED, we must abort the sync and throw so pg-boss reschedules
                if (batchErr.type === 'QUOTA_EXCEEDED') {
                    console.error('[BatchSync] Quota Exceeded. Aborting current batch process to reschedule.');
                    throw batchErr;
                }

                console.error('[BatchSync] Error processing batch:', batchErr.message);
                
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
        return { stats, logs };

    } catch (error) {
        if (error.type === 'QUOTA_EXCEEDED') {
            await supabase
                .from('competitions')
                .update({ sync_status: 'paused_quota', sync_error_message: error.message })
                .eq('id', competition.id);
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
        throw error;
    }
}

module.exports = { syncCompetition, syncAllCompetitions, exportParticipationStats, performBatchSync };
