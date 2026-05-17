
const supabase = require('../../config/supabaseClient');
const gmailService = require('../../services/gmail/gmail.service');
const { google } = require('googleapis');

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
const syncSingleStudent = async (student, competition, lastSyncedAt, gmailService, authClient) => {
    try {
        if (!student.google_refresh_token) return { status: 'skipped', reason: 'no_token' };

        const { token: accessToken } = await authClient.getAccessToken();
        if (!accessToken) return { status: 'error', reason: 'token_refresh_failed' };

        const match = await gmailService.syncStudentCompetition(
            accessToken,
            competition,
            lastSyncedAt
        );

        // Check if Devpost filter rejected the email
        if (match && match.devpost_filter && match.suggested_status === 'NOT_FOUND') {
            return {
                status: 'rejected',
                reason: match.reasoning?.[0] || 'Devpost: Email filtered out'
            };
        }

        if (match && match.suggested_status && match.suggested_status !== 'NOT_FOUND') {
            let dbStatus = match.suggested_status;

            if (dbStatus === 'QUALIFIED') dbStatus = 'SHORTLISTED';
            if (dbStatus === 'ACTION_REQUIRED') dbStatus = 'PENDING';

            const upsertData = {
                user_id: student.id,
                competition_id: competition.id,
                status: dbStatus,
                source: 'AUTO_GMAIL',
                gmail_message_id: match.gmail_message_id,
                matched_keyword: match.matched_keyword,
                confidence_score: match.confidence,
                last_synced_at: match.detected_at,
                // FIX: Use match.match_details.reasoning for breakdown
                remarks: `[${match.confidence}%] Match: ${match.suggested_status}. Breakdown: ${match.match_details?.reasoning?.join(' | ')}`,
                verified: true,
                registered_at: new Date().toISOString()
            };

            return {
                status: 'detected',
                upsertData,
                email_meta: match.email_meta,
                score_breakdown: match.match_details?.score_breakdown,
                reasoning: match.match_details?.reasoning,
                total_score: match.confidence
            };
        } else {
            return { status: 'no_match', lastSyncedAt: new Date().toISOString() };
        }

    } catch (err) {
        return { status: 'error', reason: err.message };
    }
};

// SYNC Single Competition
const syncCompetition = async (req, res) => {
    try {
        const { competitionId } = req.params;
        const { id: facultyId, department_id, assigned_sections } = req.user;

        console.log(`[Sync] Started by Faculty ${facultyId} for Comp ${competitionId}`);

        const { data: competition } = await supabase.from('competitions').select('*').eq('id', competitionId).single();
        if (!competition) return res.status(404).json({ error: 'Competition not found' });

        // Check if sync is already in progress (Sync Lock)
        if (competition.is_syncing) {
            return res.status(409).json({
                error: 'Sync already in progress',
                message: 'Another sync is currently running. Please wait and try again.'
            });
        }

        const results = await performBatchSync(competition, department_id, assigned_sections, facultyId);

        res.status(200).json({ message: 'Sync completed', stats: results });

    } catch (err) {
        console.error('[Sync] General Error:', err);
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
    }
};

// SYNC ALL Active Competitions
const syncAllCompetitions = async (req, res) => {
    try {
        const { id: facultyId, department_id, assigned_sections } = req.user;
        console.log(`[SyncAll] Started by Faculty ${facultyId}`);

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return res.status(500).json({ error: 'Server Config Error: Missing Google ID' });
        }

        const now = new Date().toISOString();
        const { data: competitions, error: compError } = await supabase
            .from('competitions')
            .select('*')
            .gte('registration_deadline', now);

        if (compError) {
            console.error('[SyncAll] DB Error Fetching Competitions:', compError.message);
            return res.status(500).json({ error: 'Database Error: Competitions' });
        }

        console.log(`[SyncAll] Found ${competitions?.length || 0} active competitions.`);

        let totalStats = { processed: 0, detected: 0, errors: 0 };

        for (const comp of competitions) {
            console.log(`[SyncAll] Processing Comp: ${comp.title}`);
            try {
                const compStats = await performBatchSync(comp, department_id, assigned_sections);
                console.log(`[SyncAll] Stats for ${comp.title}:`, compStats);

                totalStats.processed += compStats.processed;
                totalStats.detected += compStats.detected;
                totalStats.errors += compStats.errors;
            } catch (innerErr) {
                console.error(`[SyncAll] Error syncing ${comp.title}:`, innerErr);
            }
        }

        console.log('[SyncAll] Completed. Total Stats:', totalStats);
        res.status(200).json({ message: 'Sync All completed', stats: totalStats });

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

        const header = "Student Name,Reg No,Section,Competition,Platform,Status,Source,Verified\n";
        const rows = registrations.map(r => {
            const student = myStudents.find(s => s.id === r.user_id);
            if (!student) return null;
            return `${student.full_name},${student.registration_no},${student.section},"${r.competitions?.title}","${r.competitions?.platform}",${r.status},${r.source},${r.verified}`;
        }).filter(r => r).join("\n");

        res.header('Content-Type', 'text/csv');
        res.attachment(`registration_report_${new Date().getTime()}.csv`);
        res.send(header + rows);

    } catch (err) {
        console.error('[Export] Error:', err);
        res.status(500).json({ error: 'Export failed' });
    }
};

// Shared Logic for Batch Sync (Using Registrations Table ONLY)
// IMPROVED: Sync Lock, Time Tracking, Status, Deduplication, Detailed Logging
async function performBatchSync(competition, departmentId, assignedVersion, facultyId = null) {
    const syncFrom = competition.last_synced_at || competition.uploaded_at || competition.created_at;
    const syncTo = new Date().toISOString();

    // Detailed stats and logs
    const stats = { processed: 0, detected: 0, errors: 0, skipped: 0 };
    const logs = {
        processed: [], // { email, status, time }
        detected: [],  // { email, status, match_details }
        errors: [],    // { email, error }
        skipped: []    // { email, reason }
    };

    try {
        // 1. Acquire Sync Lock
        const { error: lockError } = await supabase
            .from('competitions')
            .update({
                is_syncing: true,
                sync_started_by: facultyId,
                last_sync_from: syncFrom,
                sync_status: 'running'
            })
            .eq('id', competition.id);

        if (lockError) {
            console.error('[BatchSync] Failed to acquire lock:', lockError);
            throw new Error('Failed to acquire sync lock');
        }

        console.log(`[BatchSync] Lock acquired. Scanning emails from ${syncFrom} to ${syncTo}`);

        // 2. Fetch Students (MOVED TO CONDITIONAL LOIC BELOW)

        const facultySectionsParsed = (assignedVersion || []).map(s => {
            const parts = s.split('-');
            return parts.length > 1 ? parts[parts.length - 1].trim() : s.trim();
        });

        console.log(`[BatchSync] Raw Sections: ${assignedVersion}, Parsed: ${facultySectionsParsed}`);

        // OPTIMIZATION: If competition is CLOSED, only sync ALREADY REGISTERED students
        // Goal: Check for updates (Won/Qualified) without scanning 1000s of non-participants
        const isClosed = competition.registration_deadline && new Date(competition.registration_deadline) < new Date();
        let targetStudents = [];

        if (isClosed) {
            console.log(`[BatchSync] Competition Closed. Optimizing: Syncing ONLY registered students.`);

            // Fetch users who have a registration for this competition
            const { data: regStudents, error: regError } = await supabase
                .from('registrations')
                .select('user_id, users!inner(id, email, section, google_refresh_token)')
                .eq('competition_id', competition.id)
                .eq('users.department_id', departmentId) // Ensure department safety
                .eq('users.role', 'STUDENT');

            if (regError) throw new Error(regError.message);

            // Extract user objects from the join
            const potentialStudents = regStudents.map(r => r.users);

            // Apply Section Filter
            targetStudents = potentialStudents.filter(s => {
                const sSec = s.section ? s.section.trim().toUpperCase() : '';
                return facultySectionsParsed.includes(sSec);
            });

        } else {
            console.log(`[BatchSync] Competition Open. Full Scan Mode.`);
            // Fetch ALL students in department (Standard Discovery Mode)
            const { data: students, error: studentError } = await supabase
                .from('users')
                .select('id, email, section, google_refresh_token')
                .eq('department_id', departmentId)
                .eq('role', 'STUDENT');

            if (studentError) throw new Error(studentError.message);

            console.log(`[BatchSync] Total Students in Dept: ${students.length}`);

            targetStudents = students.filter(s => {
                const sSec = s.section ? s.section.trim().toUpperCase() : '';
                return facultySectionsParsed.includes(sSec);
            });
        }

        console.log(`[BatchSync] Target Students after Filter: ${targetStudents.length}`);

        // 3. Fetch Existing Registrations and gmail_message_ids for deduplication
        const { data: existingRegs, error: regError } = await supabase
            .from('registrations')
            .select('user_id, status, last_synced_at, gmail_message_id')
            .eq('competition_id', competition.id);

        if (regError) throw new Error(regError.message);

        const regMap = new Map(existingRegs?.map(r => [r.user_id, r]) || []);
        const existingGmailIds = new Set(existingRegs?.filter(r => r.gmail_message_id).map(r => r.gmail_message_id) || []);

        const studentsToSync = targetStudents.filter(s => !!s.google_refresh_token);
        console.log(`[BatchSync] Candidates to sync: ${studentsToSync.length}`);

        // 4. Process Each Student
        for (const student of studentsToSync) {
            try {
                if (!student.google_refresh_token) {
                    console.log(`[BatchSync] Skipping ${student.email} - Missing Refresh Token`);
                    stats.skipped++;
                    logs.skipped.push({ email: student.email, reason: 'Missing Token' });
                    continue;
                }

                const regRow = regMap.get(student.id);


                const authClient = getAuthClient(student.google_refresh_token);
                const result = await syncSingleStudent(student, competition, syncFrom, gmailService, authClient);

                if (result.status === 'detected') {
                    // Deduplication Check
                    if (result.upsertData.gmail_message_id && existingGmailIds.has(result.upsertData.gmail_message_id)) {
                        console.log(`[BatchSync] Skipping duplicate email: ${result.upsertData.gmail_message_id}`);
                        stats.skipped++;
                        logs.skipped.push({ email: student.email, reason: 'Duplicate Email ID' });
                        continue;
                    }

                    // Upsert to Registrations
                    const registrationUpsertData = {
                        user_id: result.upsertData.user_id,
                        competition_id: result.upsertData.competition_id,
                        source: result.upsertData.source,
                        verified: result.upsertData.verified,
                        registered_at: result.upsertData.registered_at,
                        gmail_message_id: result.upsertData.gmail_message_id,
                        matched_keyword: result.upsertData.matched_keyword,
                        confidence_score: result.upsertData.confidence_score,
                        last_synced_at: syncTo,
                        remarks: result.upsertData.remarks
                    };

                    const { error: regUpsertError } = await supabase
                        .from('registrations')
                        .upsert(registrationUpsertData, { onConflict: 'user_id, competition_id' });

                    if (regUpsertError) {
                        console.error('[BatchSync] Registration Upsert Error:', regUpsertError);
                        stats.errors++;
                        logs.errors.push({ email: student.email, error: regUpsertError.message });
                    } else {
                        // Track this gmail_message_id as processed
                        if (result.upsertData.gmail_message_id) {
                            existingGmailIds.add(result.upsertData.gmail_message_id);
                        }
                        stats.detected++;
                        logs.detected.push({
                            email: student.email,
                            status: result.upsertData.status,
                            remarks: result.upsertData.remarks,
                            // Deep Log Details
                            subject: result.email_meta?.subject,
                            sender: result.email_meta?.sender,
                            snippet: result.email_meta?.snippet,
                            score_breakdown: result.score_breakdown,
                            // Deep Explanation
                            total_score: result.total_score,
                            matched_reasoning: result.reasoning
                        });
                    }

                    if (['SHORTLISTED', 'QUALIFIED'].includes(result.upsertData.status)) {
                        await supabase.from('competition_status').upsert({
                            user_id: result.upsertData.user_id,
                            competition_id: result.upsertData.competition_id,
                            is_shortlisted: true,
                            updated_at: new Date()
                        }, { onConflict: 'user_id, competition_id' });
                    }
                } else if (result.status === 'no_match') {
                    if (regRow) {
                        await supabase.from('registrations').update({
                            last_synced_at: syncTo
                        }).eq('user_id', student.id).eq('competition_id', competition.id);
                    }
                    stats.processed++; // Count as processed even if no match found
                    logs.processed.push({ email: student.email, status: 'No Match' });

                } else if (result.status === 'error') {
                    stats.errors++;
                    logs.errors.push({ email: student.email, error: result.reason });
                } else if (result.status === 'rejected') {
                    // Devpost or other platform-specific rejection
                    stats.skipped++;
                    logs.skipped.push({ email: student.email, reason: result.reason || 'Email filtered out' });
                } else {
                    // Should not happen, but safe fallback
                    stats.skipped++;
                    logs.skipped.push({ email: student.email, reason: `Unknown status: ${result.status}` });
                }

            } catch (e) {
                console.error(`Error processing ${student.email}:`, e.message);
                stats.errors++;
                logs.errors.push({ email: student.email, error: e.message });
            }
        }

        // 5. Update Competition with Success Status
        const syncStatus = stats.errors > 0 ? (stats.detected > 0 ? 'partial' : 'failed') : 'success';
        const syncErrorMsg = stats.errors > 0 ? `${stats.errors} students failed to sync` : null;

        await supabase
            .from('competitions')
            .update({
                is_syncing: false,
                last_synced_at: syncTo,
                last_sync_from: syncFrom,
                last_sync_to: syncTo,
                sync_status: syncStatus,
                sync_error_message: syncErrorMsg
            })
            .eq('id', competition.id);

        console.log(`[BatchSync] Completed. Status: ${syncStatus}`, stats);
        return { stats, logs };

    } catch (error) {
        // 6. Release Lock and Set Failed Status on Error
        console.error('[BatchSync] Critical Error:', error);

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
