
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

        const { token: accessToken } = await authClient.getAccessToken();  // This refreshes it
        if (!accessToken) return { status: 'error', reason: 'token_refresh_failed' };

        const match = await gmailService.syncStudentCompetition(
            accessToken,
            competition.title,
            competition.platform,
            lastSyncedAt
        );

        if (match && match.suggested_status !== 'NOT_FOUND') {
            let suggested = match.suggested_status; // REGISTERED, SHORTLISTED, REJECTED

            // Map detected status
            const upsertData = {
                student_id: student.id,
                competition_id: competition.id,
                status: 'PENDING', // Always PENDING as "Assistive"
                verification_source: 'AUTO_GMAIL',
                gmail_message_id: match.gmail_message_id,
                matched_keyword: match.matched_keyword,
                confidence_score: match.confidence,
                last_synced_at: match.detected_at, // Use service timestamp
                remarks: `Gmail Suggestion: ${suggested} (Confidence: ${match.confidence}%)`
            };

            return { status: 'detected', upsertData };
        } else {
            return { status: 'no_match', lastSyncedAt: new Date().toISOString() };
        }

    } catch (err) {
        // console.error(`Sync error for ${student.email}:`, err.message);
        return { status: 'error', reason: err.message };
    }
};

// SYNC Single Competition
const syncCompetition = async (req, res) => {
    try {
        const { competitionId } = req.params;
        const { id: facultyId, department_id, assigned_sections } = req.user;

        console.log(`[Sync] Started by Faculty ${facultyId} for Comp ${competitionId}`);

        // 1. Fetch Comp & Students
        const { data: competition } = await supabase.from('competitions').select('*').eq('id', competitionId).single();
        if (!competition) return res.status(404).json({ error: 'Competition not found' });

        const results = await performBatchSync(competition, department_id, assigned_sections);

        res.status(200).json({ message: 'Sync completed', stats: results });

    } catch (err) {
        console.error('[Sync] General Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// SYNC ALL Active Competitions
const syncAllCompetitions = async (req, res) => {
    try {
        const { id: facultyId, department_id, assigned_sections } = req.user;
        console.log(`[SyncAll] Started by Faculty ${facultyId}`);

        // Check Env Vars
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            console.error('[SyncAll] Missing Google Credentials in .env');
            return res.status(500).json({ error: 'Server Config Error: Missing Google ID/Secret' });
        }

        // 1. Fetch Active Competitions
        const now = new Date().toISOString();
        const { data: competitions, error: compError } = await supabase
            .from('competitions')
            .select('*')
            .gte('registration_deadline', now); // Open competitions

        if (compError) {
            console.error('[SyncAll] DB Error Fetching Competitions:', compError.message);
            return res.status(500).json({ error: 'Database Error: Competitions' });
        }

        console.log(`[SyncAll] Found ${competitions?.length || 0} active competitions.`);

        let totalStats = { processed: 0, detected: 0, errors: 0 };

        // 2. Iterate and Sync each
        for (const comp of competitions) {
            console.log(`[SyncAll] Processing Comp: ${comp.title}`);
            try {
                const compStats = await performBatchSync(comp, department_id, assigned_sections);
                console.log(`[SyncAll] Stats for ${comp.title}:`, compStats);

                totalStats.processed += compStats.processed;
                totalStats.detected += compStats.detected;
                totalStats.errors += compStats.errors;
            } catch (innerErr) {
                console.error(`[SyncAll] Error syncing competition ${comp.title}:`, innerErr);
            }
        }

        console.log('[SyncAll] Completed. Total Stats:', totalStats);
        res.status(200).json({ message: 'Sync All completed', stats: totalStats });

    } catch (err) {
        console.error('[SyncAll] Critical Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// EXPORT Report
const exportParticipationStats = async (req, res) => {
    try {
        const { id: facultyId, department_id, assigned_sections } = req.user;

        // Fetch All Participation for Faculty's Section
        // Join with Users and Competitions

        // 1. Get Students
        const facultySectionsParsed = (assigned_sections || []).map(s => {
            const parts = s.split('-');
            return parts.length > 1 ? parts[parts.length - 1].trim() : s.trim();
        });

        // Simplified: Get all users in Dept, filter section
        const { data: users, error: userError } = await supabase.from('users').select('id, full_name, email, registration_no, section').eq('department_id', department_id).eq('role', 'STUDENT');

        if (userError) {
            console.error('[Export] DB Error Fetching Users:', userError.message);
            return res.status(500).json({ error: 'Database Error: Users' });
        }

        const myStudents = users.filter(u => facultySectionsParsed.includes(u.section?.trim().toUpperCase()));
        const myStudentIds = myStudents.map(u => u.id);

        if (myStudentIds.length === 0) return res.status(200).send("No students found in your section.");

        // 2. Get Participation
        const { data: participations, error: partError } = await supabase
            .from('participation')
            .select(`
                status, confidence_score, verification_source, created_at,
                competitions (title, platform),
                student_id
            `)
            .in('student_id', myStudentIds);

        if (partError) {
            console.error('[Export] DB Error Fetching Participation:', partError.message);
            // Verify if table exists
            if (partError.message?.includes('does not exist')) {
                return res.status(500).json({ error: 'Database Error: Participation table missing. Run migrations.' });
            }
            return res.status(500).json({ error: 'Database Error: Participation history' });
        }

        // 3. Build CSV
        const header = "Student Name,Reg No,Section,Competition,Platform,Status,Confidence,Source\n";
        const rows = participations.map(p => {
            const student = myStudents.find(s => s.id === p.student_id);
            if (!student) return null;
            return `${student.full_name},${student.registration_no},${student.section},"${p.competitions?.title}","${p.competitions?.platform}",${p.status},${p.confidence_score || 0},${p.verification_source}`;
        }).filter(r => r).join("\n");

        res.header('Content-Type', 'text/csv');
        res.attachment(`participation_report_${new Date().getTime()}.csv`);
        res.send(header + rows);

    } catch (err) {
        console.error('[Export] Error:', err);
        res.status(500).json({ error: 'Export failed' });
    }
};


// Shared Logic for Batch Sync
async function performBatchSync(competition, departmentId, assignedVersion) {
    // Fetch students in dept
    const { data: students, error: studentError } = await supabase
        .from('users')
        .select('id, email, section, google_refresh_token, full_name')
        .eq('department_id', departmentId)
        .eq('role', 'STUDENT');

    if (studentError) {
        console.error('[BatchSync] Error fetching students:', studentError.message);
        throw new Error(`DB Error: ${studentError.message}`);
    }

    // Filter by Faculty Assigned Sections
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


    const { data: existingRows, error: partError } = await supabase
        .from('participation')
        .select('student_id, status, last_synced_at')
        .eq('competition_id', competition.id);

    if (partError) {
        console.error('[BatchSync] Error fetching participation:', partError.message);
        throw new Error(`DB Error: ${partError.message}`);
    }

    const participationMap = new Map(existingRows?.map(r => [r.student_id, r]) || []);

    // Filter Eligible: Not Registered or Pending
    const studentsToSync = targetStudents.filter(s => {
        const row = participationMap.get(s.id);
        if (!row) return true;
        return row.status === 'PENDING' || row.status === 'NOT_REGISTERED';
    });

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

            const authClient = getAuthClient(student.google_refresh_token);

            // Helper call
            const result = await syncSingleStudent(student, competition, lastSyncedAt, gmailService, authClient);

            if (result.status === 'detected') {
                await supabase.from('participation').upsert(result.upsertData, { onConflict: 'student_id, competition_id' });
                stats.detected++;
            } else if (result.status === 'no_match') {
                // Update last_synced_at
                await supabase.from('participation').upsert({
                    student_id: student.id,
                    competition_id: competition.id,
                    status: row ? row.status : 'NOT_REGISTERED',
                    last_synced_at: result.lastSyncedAt
                }, { onConflict: 'student_id, competition_id' });
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
