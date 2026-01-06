
const supabase = require('../../config/supabaseClient');
const gmailService = require('../../services/gmailService');
const { google } = require('googleapis');

// Helper to get OAuth2 Client with Refresh Token
const getAuthClient = (refreshToken) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000'; // Placeholder

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

        if (match && match.suggested_status !== 'NOT_FOUND') {
            let suggested = match.suggested_status; // REGISTERED, SHORTLISTED, REJECTED
        if (match) {
            let dbStatus = match.status; // REGISTERED, QUALIFIED, REJECTED
            // Map common Gmail statuses to our DB statuses
            if (dbStatus === 'QUALIFIED') dbStatus = 'SHORTLISTED';
            if (dbStatus === 'ACTION_REQUIRED') dbStatus = 'PENDING';

            // Map detected status
            // SINGLE SOURCE OF TRUTH: Update 'registrations' table directly
            // verified = true because we found proof in their email
            const upsertData = {
                user_id: student.id, // Note: registrations table uses 'user_id'
                competition_id: competition.id,
                status: 'PENDING', // Always PENDING as "Assistive"
                verification_source: 'AUTO_GMAIL',
                gmail_message_id: match.gmail_message_id,
                matched_keyword: match.matched_keyword,
                confidence_score: match.confidence,
                last_synced_at: match.detected_at,
                remarks: `[${match.confidence_level}] Match: ${suggested}. Breakdown: ${match.match_breakdown?.join(', ')}`
                status: dbStatus,
                verified: true,
                source: 'GMAIL_SYNC',
                // proof_url: match.id // Optional: store message ID as proof?
                registered_at: new Date().toISOString() // Or keep original if exists? Upsert handles this if we don't overwrite.
            };

            return { status: 'detected', upsertData };
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

        // 1. Fetch Comp
        const { data: competition } = await supabase.from('competitions').select('*').eq('id', competitionId).single();
        if (!competition) return res.status(404).json({ error: 'Competition not found' });

        const results = await performBatchSync(competition, department_id, assigned_sections);

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
        if (compError) return res.status(500).json({ error: 'Database Error: Competitions' });

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

// EXPORT Report - Reading from REGISTRATIONS now (Source of Truth)
const exportParticipationStats = async (req, res) => {
    try {
        const { id: facultyId, department_id, assigned_sections } = req.user;

        // 1. Get My Students
        const facultySectionsParsed = (assigned_sections || []).map(s => {
            const parts = s.split('-');
            return parts.length > 1 ? parts[parts.length - 1].trim() : s.trim();
        });

        const { data: users, error: userError } = await supabase.from('users').select('id, full_name, email, registration_no, section').eq('department_id', department_id).eq('role', 'STUDENT');
        if (userError) throw userError;

        const myStudents = users.filter(u => facultySectionsParsed.includes(u.section?.trim().toUpperCase()));
        const myStudentIds = myStudents.map(u => u.id);

        if (myStudentIds.length === 0) return res.status(200).send("No students found.");

        // 2. Get Registrations (Source of Truth)
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select(`
                status, source, verified, registered_at,
                competitions (title, platform),
                user_id
            `)
            .in('user_id', myStudentIds);

        if (regError) throw regError;

        // 3. Build CSV
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

// Shared Logic for Batch Sync (Using Registrations Table)
async function performBatchSync(competition, departmentId, assignedVersion) {
    // 1. Fetch Class Students
    const { data: students, error: studentError } = await supabase
        .from('users')
        .select('id, email, section, google_refresh_token')
        .eq('department_id', departmentId)
        .eq('role', 'STUDENT');

    if (studentError) throw new Error(studentError.message);

    const facultySectionsParsed = (assignedVersion || []).map(s => {
        const parts = s.split('-');
        return parts.length > 1 ? parts[parts.length - 1].trim() : s.trim();
    });

    console.log(`[BatchSync] Raw Sections: ${assignedVersion}, Parsed: ${facultySectionsParsed}`);
    console.log(`[BatchSync] Total Students in Dept: ${students.length}`);

    const targetStudents = students.filter(s => {
        const sSec = s.section ? s.section.trim().toUpperCase() : '';
        // Debug sample
        // if (Math.random() < 0.01) console.log(`[BatchSync] Checking User ${s.email} Sec: ${sSec} vs ${facultySectionsParsed}`);
        return facultySectionsParsed.includes(sSec);
    });

    console.log(`[BatchSync] Target Students after Section Filter: ${targetStudents.length}`);


    // 2. Fetch Existing Registrations (to avoid redundant Gmail API usage)
    const { data: existingRegs, error: regError } = await supabase
        .from('registrations')
        .select('user_id, status')
        .eq('competition_id', competition.id);

    if (regError) throw new Error(regError.message);

    const regMap = new Map(existingRegs?.map(r => [r.user_id, r]) || []);

    // 3. Filter: Sync explicitly if NOT registered or Status is PENDING/ACTION_REQUIRED
    // If they are already VERIFIED or REGISTERED, we might still want to check for UPGRADES (e.g. Qualified).
    // For now, let's sync everyone who has a token to be safe, but maybe skip 'WON' status?
    // User Rule: "If already exists -> update status".
    // Efficient strategy: Sync everyone with a token.

    const studentsToSync = targetStudents.map(s => {
        if (s.email === 'student1@citchennai.net') {
            return { ...s, google_refresh_token: 'MOCK_TOKEN' };
        }
        return s;
    }).filter(s => !!s.google_refresh_token);

    const stats = { processed: 0, detected: 0, errors: 0 };
    console.log(`[BatchSync] candidates to sync: ${studentsToSync.length}`);

    for (const student of studentsToSync) {
        try {
            if (!student.google_refresh_token) {
                console.log(`[BatchSync] Skipping ${student.email} - Missing Refresh Token`);
                continue;
            }

            const row = participationMap.get(student.id);
            const lastSyncedAt = row ? row.last_synced_at : null;
            const row = regMap.get(student.id);
            // Optimization: If already WON, skip?
            if (row && row.status === 'WON') continue;

            const authClient = getAuthClient(student.google_refresh_token);
            // Pass null for lastSyncedAt since we want fresh check or don't track it in regs table easily
            const result = await syncSingleStudent(student, competition, null, gmailService, authClient);

            if (result.status === 'detected') {
                await supabase.from('participation').upsert(result.upsertData, { onConflict: 'student_id, competition_id' });
                stats.detected++;
            } else if (result.status === 'no_match') {
                // Only update last_synced_at if record ALREADY exists
                if (row) {
                    await supabase.from('participation').upsert({
                        student_id: student.id,
                        competition_id: competition.id,
                        status: row.status, // Keep existing status
                        last_synced_at: result.lastSyncedAt
                    }, { onConflict: 'student_id, competition_id' });
                }
                // Else: Do nothing. Don't create "NOT_REGISTERED" ghosts.
                // UPSERT to Registrations
                await supabase.from('registrations').upsert(result.upsertData, { onConflict: 'user_id, competition_id' });
                // Also update stats if they weren't previously registered
                if (!row) stats.detected++;
            } else if (result.status === 'error') {
                stats.errors++;
            }

            stats.processed++;
        } catch (e) {
            console.error(`Error processing ${student.email}:`, e.message);
            stats.errors++;
        }
    }
    return stats;
}

module.exports = { syncCompetition, syncAllCompetitions, exportParticipationStats };
