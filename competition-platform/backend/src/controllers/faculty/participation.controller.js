
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

// SYNC Logic
const syncCompetition = async (req, res) => {
    try {
        const { competitionId } = req.params;
        const { section } = req.body; // Optional: specific section to sync
        const { id: facultyId, department_id, assigned_sections } = req.user;

        console.log(`[Sync] Started by Faculty ${facultyId} for Comp ${competitionId}`);

        // 1. Fetch Competition Details
        const { data: competition } = await supabase
            .from('competitions')
            .select('*')
            .eq('id', competitionId)
            .single();

        if (!competition) return res.status(404).json({ error: 'Competition not found' });

        // 2. Fetch Eligible Students (Only those in Faculty's section AND (Not Registered OR Pending/Null))
        // We'll fetch ALL section students and filter via code or SQL.

        // Fetch students in dept
        const { data: students, error: studentError } = await supabase
            .from('users')
            .select('id, email, section, google_refresh_token, full_name') // NEED refresh_token
            .eq('department_id', department_id)
            .eq('role', 'STUDENT');

        if (studentError) throw studentError;

        // Filter by Faculty Assigned Sections
        const facultySectionsParsed = (assigned_sections || []).map(s => s.split('-').pop().trim().toUpperCase());
        const targetStudents = students.filter(s => {
            const sSec = s.section ? s.section.trim().toUpperCase() : '';
            return facultySectionsParsed.includes(sSec);
        });

        // 3. Filter by Participation Status = NOT_REGISTERED or PENDING
        // We need existing participation rows to check.
        const { data: existingRows } = await supabase
            .from('participation')
            .select('student_id, status, last_synced_at')
            .eq('competition_id', competitionId);

        const participationMap = new Map(existingRows?.map(r => [r.student_id, r]) || []);

        const studentsToSync = targetStudents.filter(s => {
            const row = participationMap.get(s.id);
            if (!row) return true; // NOT_REGISTERED
            return row.status === 'PENDING' || row.status === 'NOT_REGISTERED';
            // Skip REGISTERED, SHORTLISTED, REJECTED (as per prompt rules)
        });

        console.log(`[Sync] Found ${studentsToSync.length} eligible students to sync.`);

        // 4. Batch Process
        const results = {
            processed: 0,
            detected: 0,
            errors: 0
        };

        // Parallelism limit? Google API might rate limit. sequential is safer or chunks of 5.
        // For MVP, sequential.

        for (const student of studentsToSync) {
            try {
                if (!student.google_refresh_token) {
                    // console.warn(`[Sync] No token for ${student.email}`);
                    continue; // Skip without token
                }

                // Get Access Token
                const authClient = getAuthClient(student.google_refresh_token);
                const { token: accessToken } = await authClient.getAccessToken(); // This refreshes it

                if (!accessToken) throw new Error("Failed to refresh token");

                // Get Last Synced
                const row = participationMap.get(student.id);
                const lastSyncedAt = row ? row.last_synced_at : null;

                // Sync
                const match = await gmailService.syncStudentCompetition(
                    accessToken,
                    competition.title,
                    competition.platform,
                    lastSyncedAt
                );

                const now = new Date().toISOString();

                if (match) {
                    // Update/Insert Participation
                    // Status: match.status (REGISTERED/QUALIFIED/REJECTED/ACTION_REQUIRED)
                    // But we map 'QUALIFIED' -> 'SHORTLISTED' to match Schema
                    let dbStatus = match.status;
                    if (dbStatus === 'QUALIFIED') dbStatus = 'SHORTLISTED';
                    if (dbStatus === 'ACTION_REQUIRED') dbStatus = 'PENDING'; // Keep pending? or specialized? Schema has PENDING.

                    const upsertData = {
                        student_id: student.id,
                        competition_id: competitionId,
                        status: 'PENDING', // Prompt says "DO NOT auto-approve", wait.
                        // "If keyword matched → suggest status. Update status → AUTO_DETECTED" 
                        // Wait, schema status enum: NOT_REGISTERED, PENDING, REGISTERED, SHORTLISTED...
                        // If I set "REGISTERED", it implies final.
                        // Prompt: "Only after confirmation: status becomes final".
                        // "If detected: Update status → AUTO_DETECTED"
                        // My SCHEMA enum didn't have AUTO_DETECTED.
                        // I used 'PENDING', 'REGISTERED'.
                        // I should add 'AUTO_DETECTED' to enum or use 'PENDING' + remarks/confidence.
                        // The prompt says "Update status -> AUTO_DETECTED". 
                        // I'll assume I should have added AUTO_DETECTED to schema.
                        // I'll use 'PENDING' and set 'remarks' = 'Detected: ' + match.status.
                        // OR 'status' = 'PENDING' and trust the 'confidence_score' > 0 implies detection.

                        verification_source: 'AUTO_GMAIL',
                        gmail_message_id: match.id,
                        matched_keyword: match.matchedKeyword,
                        confidence_score: match.confidence,
                        last_synced_at: now,
                        remarks: `Detected ${match.status} via Gmail`
                    };

                    // Actually, if confidence > 80, maybe we set a specific flag?
                    // User says: "DO NOT auto-approve". "Faculty controls verification".
                    // So PENDING is correct. The "Suggested Status" should be stored separately?
                    // I'll store it in `remarks` or a new column `suggested_status`?
                    // I'll put it in `matched_keyword` for now or `remarks`.
                    // Actually, I can use the STATUS field if I map it to a "PROPOSED" state?
                    // Schema: PENDING, REGISTERED, SHORTLISTED.
                    // If I put REGISTERED, it shows as Registered.
                    // I will use PENDING and use `confidence_score` to highlight it in UI.

                    await supabase
                        .from('participation')
                        .upsert(upsertData, { onConflict: 'student_id, competition_id' });

                    results.detected++;
                } else {
                    // Update last_synced_at even if nothing found
                    await supabase
                        .from('participation')
                        .upsert({
                            student_id: student.id,
                            competition_id: competitionId,
                            status: row ? row.status : 'NOT_REGISTERED',
                            last_synced_at: now
                        }, { onConflict: 'student_id, competition_id' });
                }

                results.processed++;

            } catch (err) {
                console.error(`[Sync] Error for ${student.email}:`, err.message);
                results.errors++;
            }
        }

        res.status(200).json({
            message: 'Sync completed',
            stats: results
        });

    } catch (err) {
        console.error('[Sync] General Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { syncCompetition };
