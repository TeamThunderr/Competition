// Gmail Sync V2 Service - Faculty-Controlled, Incremental, State-Consistent
// Implements clean separation between FACT (registrations) and PROGRESSION (competition_status)

const { google } = require('googleapis');
const supabase = require('../config/supabaseClient');
const { detectHackathonStatus } = require('./gmailService');

/**
 * GMAIL SYNC V2 - CORE PRINCIPLES:
 * 1. Faculty-controlled timing
 * 2. Incremental sync (only new emails)
 * 3. State consistency (REGISTERED → QUALIFIED → WON)
 * 4. Single write path
 * 5. Idempotent operations
 */

/**
 * Faculty-initiated Gmail sync for a specific competition
 * @param {string} competitionId - Competition UUID
 * @param {string} facultyId - Faculty member initiating sync
 * @returns {Promise<Object>} Sync results and statistics
 */
const syncCompetitionV2 = async (competitionId, facultyId, studentIds = null) => {
    console.log(`[GmailSyncV2] Starting sync for competition ${competitionId} by faculty ${facultyId}`);

    try {
        // 1. Get competition details and determine sync window
        const { data: competition, error: compError } = await supabase
            .from('competitions')
            .select('id, title, organizer, platform, uploaded_at, last_synced_at')
            .eq('id', competitionId)
            .single();

        if (compError || !competition) {
            throw new Error(`Competition not found: ${compError?.message}`);
        }

        // 2. Determine Gmail scan start time (incremental sync)
        const scanStartTime = competition.last_synced_at || competition.uploaded_at;
        const scanEndTime = new Date().toISOString();

        console.log(`[GmailSyncV2] Scanning emails from ${scanStartTime} to ${scanEndTime}`);

        // 3. Get Students (Dual Strategy)
        let students = [];

        if (studentIds && studentIds.length > 0) {
            // Strategy A: Explicit ID List (from Faculty Controller)
            console.log(`[GmailSyncV2] Using provided list of ${studentIds.length} students`);

            // We still need to fetch student details (email) for these IDs
            // Batch fetch to avoid huge query string if list is massive? 
            // Supabase 'in' operator handles reasonable sizes well (thousands).

            const { data: studentsData, error: studentsError } = await supabase
                .from('users')
                .select('id, email, full_name, section')
                .in('id', studentIds);

            if (studentsError) throw new Error(`Failed to fetch student details: ${studentsError.message}`);
            students = studentsData;

        } else {
            // Strategy B: Fallback (Legacy Section-Based)
            console.log(`[GmailSyncV2] No student IDs provided, falling back to section-based lookup`);

            const { data: faculty, error: facultyError } = await supabase
                .from('users')
                .select('department_id, assigned_sections')
                .eq('id', facultyId)
                .eq('role', 'FACULTY')
                .single();

            if (facultyError || !faculty) {
                throw new Error(`Faculty not found: ${facultyError?.message}`);
            }

            const { data: studentsData, error: studentsError } = await supabase
                .from('users')
                .select('id, email, full_name, section')
                .eq('role', 'STUDENT')
                .eq('department_id', faculty.department_id)
                .in('section', faculty.assigned_sections || []); // Strict check

            if (studentsError) throw new Error(`Failed to get students: ${studentsError.message}`);
            students = studentsData;
        }

        console.log(`[GmailSyncV2] Processing ${students.length} students`);

        // 5. Process each student's Gmail
        const syncResults = {
            totalStudents: students.length,
            processedStudents: 0,
            newRegistrations: 0,
            qualificationUpdates: 0,
            winnerUpdates: 0,
            errors: []
        };

        for (const student of students) {
            try {
                await processStudentGmail(student, competition, scanStartTime, scanEndTime, syncResults);
                syncResults.processedStudents++;
            } catch (error) {
                console.error(`[GmailSyncV2] Error processing student ${student.email}:`, error.message);
                syncResults.errors.push({
                    studentEmail: student.email,
                    error: error.message
                });
            }
        }

        // 6. Update competition's last_synced_at timestamp
        const { error: updateError } = await supabase
            .from('competitions')
            .update({ last_synced_at: scanEndTime })
            .eq('id', competitionId);

        if (updateError) {
            console.error(`[GmailSyncV2] Failed to update last_synced_at:`, updateError);
        }

        console.log(`[GmailSyncV2] Sync completed:`, syncResults);
        return syncResults;

    } catch (error) {
        console.error(`[GmailSyncV2] Sync failed:`, error);
        throw error;
    }
};
/**
 * Process individual student's Gmail for competition detection
 * Implements V2 write rules: REGISTERED → QUALIFIED → WON (never downgrade)
 */
const processStudentGmail = async (student, competition, scanStartTime, scanEndTime, syncResults) => {
    // Get student's Gmail access token (this would come from OAuth flow)
    const accessToken = await getStudentGmailToken(student.id);

    if (!accessToken) {
        console.log(`[GmailSyncV2] No Gmail token for student ${student.email}, skipping`);
        return;
    }

    // Scan Gmail for competition-related emails in the time window
    const emailMatches = await scanGmailInTimeWindow(
        accessToken,
        competition,
        scanStartTime,
        scanEndTime
    );

    if (emailMatches.length === 0) {
        console.log(`[GmailSyncV2] No new emails found for ${student.email}`);
        return;
    }

    // Process each email match and apply V2 write rules
    for (const match of emailMatches) {
        await applyGmailDetectionV2(student.id, competition.id, match.detectedStatus, syncResults);
    }
};

/**
 * Apply Gmail detection results using V2 write rules
 * CRITICAL: Implements state progression rules (never downgrade)
 */
const applyGmailDetectionV2 = async (userId, competitionId, detectedStatus, syncResults) => {
    console.log(`[GmailSyncV2] Applying status ${detectedStatus} for user ${userId}`);

    try {
        switch (detectedStatus) {
            case 'REGISTERED':
                await ensureRegistrationExists(userId, competitionId, 'AUTO_GMAIL');
                syncResults.newRegistrations++;
                break;

            case 'QUALIFIED':
                // Ensure registration exists first (FACT)
                await ensureRegistrationExists(userId, competitionId, 'AUTO_GMAIL');
                // Then update progression status
                await upsertCompetitionStatus(userId, competitionId, { is_shortlisted: true });
                syncResults.qualificationUpdates++;
                break;

            case 'WON':
                // Ensure registration exists first (FACT)
                await ensureRegistrationExists(userId, competitionId, 'AUTO_GMAIL');
                // Then update progression status (winner implies shortlisted)
                await upsertCompetitionStatus(userId, competitionId, {
                    is_shortlisted: true,
                    is_winner: true
                });
                syncResults.winnerUpdates++;
                break;

            case 'REJECTED':
                // Do NOTHING - keep registration fact if it exists
                console.log(`[GmailSyncV2] REJECTED status detected, no action taken`);
                break;

            default:
                console.log(`[GmailSyncV2] Unknown status ${detectedStatus}, ignoring`);
        }
    } catch (error) {
        console.error(`[GmailSyncV2] Failed to apply status ${detectedStatus}:`, error);
        throw error;
    }
};
/**
 * Ensure registration record exists (FACT table)
 * Idempotent - safe to call multiple times
 */
const ensureRegistrationExists = async (userId, competitionId, source) => {
    const { data, error } = await supabase
        .from('registrations')
        .upsert({
            user_id: userId,
            competition_id: competitionId,
            source: source,
            verified: true, // Gmail-verified
            verified_by: null // System verification
        }, {
            onConflict: 'user_id,competition_id',
            ignoreDuplicates: false // Update existing records
        })
        .select();

    if (error) {
        throw new Error(`Failed to ensure registration: ${error.message}`);
    }

    return data;
};

/**
 * Update competition status (PROGRESSION table)
 * Implements state progression rules - never downgrade
 */
const upsertCompetitionStatus = async (userId, competitionId, statusUpdate) => {
    // First, get current status to prevent downgrades
    const { data: currentStatus } = await supabase
        .from('competition_status')
        .select('is_shortlisted, is_winner')
        .eq('user_id', userId)
        .eq('competition_id', competitionId)
        .single();

    // Apply progression rules (never downgrade)
    const finalUpdate = {
        user_id: userId,
        competition_id: competitionId,
        is_shortlisted: statusUpdate.is_shortlisted || (currentStatus?.is_shortlisted || false),
        is_winner: statusUpdate.is_winner || (currentStatus?.is_winner || false),
        updated_at: new Date().toISOString()
    };

    // Ensure winner implies shortlisted
    if (finalUpdate.is_winner) {
        finalUpdate.is_shortlisted = true;
    }

    const { data, error } = await supabase
        .from('competition_status')
        .upsert(finalUpdate, {
            onConflict: 'user_id,competition_id'
        })
        .select();

    if (error) {
        throw new Error(`Failed to update competition status: ${error.message}`);
    }

    return data;
};
/**
 * Scan Gmail in specific time window (incremental sync)
 */
const scanGmailInTimeWindow = async (accessToken, competition, startTime, endTime) => {
    try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth });

        // Build time-based query for incremental sync
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        const afterQuery = `after:${startDate.getFullYear()}/${startDate.getMonth() + 1}/${startDate.getDate()}`;
        const beforeQuery = `before:${endDate.getFullYear()}/${endDate.getMonth() + 1}/${endDate.getDate()}`;

        // Search for competition-related emails in time window
        const searchQuery = `${competition.title} ${afterQuery} ${beforeQuery}`;

        const response = await gmail.users.messages.list({
            userId: 'me',
            q: searchQuery,
            maxResults: 50
        });

        const messages = response.data.messages || [];
        const matches = [];

        // Process each message
        for (const msg of messages) {
            const details = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'metadata',
                metadataHeaders: ['Subject', 'From', 'Date']
            });

            const emailData = {
                subject: details.data.payload.headers.find(h => h.name === 'Subject')?.value || '',
                from: details.data.payload.headers.find(h => h.name === 'From')?.value || '',
                date: details.data.payload.headers.find(h => h.name === 'Date')?.value || '',
                snippet: details.data.snippet || ''
            };

            // Use existing detection logic
            const detection = detectHackathonStatus(emailData);

            if (detection && detection.confidence > 60) { // High confidence threshold
                matches.push({
                    emailId: msg.id,
                    detectedStatus: detection.status,
                    confidence: detection.confidence,
                    emailData
                });
            }
        }

        return matches;

    } catch (error) {
        console.error(`[GmailSyncV2] Gmail scan failed:`, error);
        return [];
    }
};

/**
 * Get student's Gmail access token
 * Exchanges stored refresh token for a fresh access token using Google OAuth
 */
const getStudentGmailToken = async (userId) => {
    try {
        // 1. Get stored refresh token
        const { data: user, error } = await supabase
            .from('users')
            .select('google_refresh_token, email')
            .eq('id', userId)
            .single();

        if (error || !user || !user.google_refresh_token) {
            if (user?.email) console.log(`[GmailSyncV2] No refresh token for ${user.email}`);
            return null;
        }

        // 2. Setup OAuth Client
        const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = require('../config/env');

        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            console.error('[GmailSyncV2] Missing Google Credentials in env!');
            return null;
        }

        const oAuth2Client = new google.auth.OAuth2(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            GOOGLE_REDIRECT_URI || 'http://localhost:5173'
        );

        // 3. Set Credentials & Refresh
        oAuth2Client.setCredentials({ refresh_token: user.google_refresh_token });

        const { credentials } = await oAuth2Client.refreshAccessToken();

        // console.log(`[GmailSyncV2] Token refreshed for ${user.email}`);
        return credentials.access_token;

    } catch (error) {
        console.error(`[GmailSyncV2] Token exchange failed for user ${userId}:`, error.message);
        return null;
    }
};

module.exports = {
    syncCompetitionV2,
    ensureRegistrationExists,
    upsertCompetitionStatus
};