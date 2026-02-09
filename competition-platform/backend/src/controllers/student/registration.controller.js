// File Name: registration.controller.js
// Purpose: Handle student registration attempts (Gmail check or Proof upload)
// V2 Implementation: Uses clean FACT/PROGRESSION separation

const supabase = require('../../config/supabaseClient');
const gmailService = require('../../services/gmail/gmail.service');

// Defined locally to replace deleted service
const ensureRegistrationExists = async (userId, competitionId, source) => {
    // Check if exists first to avoid unnecessary writes
    const { data: existing } = await supabase
        .from('registrations')
        .select('id')
        .eq('user_id', userId)
        .eq('competition_id', competitionId)
        .single();

    if (existing) return;

    // Create if missing
    await supabase.from('registrations').upsert({
        user_id: userId,
        competition_id: competitionId,
        source: source,
        verified: true,
        registered_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
    }, { onConflict: 'user_id, competition_id' });
};

const upsertCompetitionStatus = async (userId, competitionId, statusUpdate) => {
    await supabase.from('competition_status').upsert({
        user_id: userId,
        competition_id: competitionId,
        ...statusUpdate,
        updated_at: new Date()
    }, { onConflict: 'user_id, competition_id' });
};

const checkRegistrationStatus = async (req, res) => {
    try {
        console.log('[RegistrationV2] Request received:', req.body, 'User:', req.userId);
        const { competition_id, provider_token } = req.body;
        const student_id = req.userId;

        if (!competition_id) return res.status(400).json({ error: 'Competition ID is required' });

        // 1. Get Competition Details
        const { data: competition, error: compError } = await supabase
            .from('competitions')
            .select('title, organizer, platform')
            .eq('id', competition_id)
            .single();

        if (compError || !competition) {
            console.error('[RegistrationV2] Competition Lookup Error:', compError);
            return res.status(404).json({ error: 'Competition not found', details: compError });
        }

        // 2. Perform Gmail Verification
        if (!provider_token) {
            return res.status(400).json({ error: 'Gmail access token required for verification.' });
        }

        console.log(`[RegistrationV2] Verifying '${competition.title}' for user ${student_id}...`);

        // Check CURRENT status in DB
        const { data: currentStatus } = await supabase
            .from('registrations')
            .select('verified, last_synced_at')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .single();

        // If already registered/verified, check for SHORTLIST/WINNER status
        if (currentStatus && currentStatus.verified) {
            console.log('[RegistrationV2] User already registered. Checking for Shortlist/Winner updates...');

            const shortlistMatch = await gmailService.checkShortlistStatus(
                provider_token,
                competition,
                currentStatus.last_synced_at // Respect sync window
            );

            if (shortlistMatch.status) {
                console.log(`[RegistrationV2] Found update: ${shortlistMatch.status}`);

                // Update DB
                if (shortlistMatch.status === 'QUALIFIED') {
                    await upsertCompetitionStatus(student_id, competition_id, { is_shortlisted: true });
                }

                // Update last synced time
                await supabase.from('registrations')
                    .update({ last_synced_at: new Date().toISOString() })
                    .eq('user_id', student_id)
                    .eq('competition_id', competition_id);

                return res.status(200).json({
                    verified: true,
                    status: shortlistMatch.status,
                    confidence: shortlistMatch.confidence,
                    message: `Status updated to ${shortlistMatch.status}!`
                });
            } else {
                console.log('[RegistrationV2] No new updates found.');
                return res.status(200).json({
                    verified: true,
                    status: 'REGISTERED', // No change
                    message: 'No new updates found. Still Registered.'
                });
            }
        }

        // Use existing Gmail service for detection (Initial Registration)
        const match = await gmailService.syncStudentCompetition(
            provider_token,
            competition,
            null // No lastSyncedAt for initial check
        );

        if (match && match.suggested_status && match.confidence >= 40) {
            console.log('[RegistrationV2] Verification Successful:', match);

            // 3. Apply V2 Write Rules
            const detectedStatus = match.suggested_status;
            console.log(`[RegistrationV2] Applying V2 rules for status: ${detectedStatus}`);

            switch (detectedStatus) {
                case 'REGISTERED':
                    await ensureRegistrationExists(student_id, competition_id, 'AUTO_GMAIL');
                    break;
                case 'QUALIFIED':
                    await ensureRegistrationExists(student_id, competition_id, 'AUTO_GMAIL');
                    await upsertCompetitionStatus(student_id, competition_id, { is_shortlisted: true });
                    break;

                default:
                    console.log(`[RegistrationV2] Status ${detectedStatus} - no action taken`);
            }

            return res.status(200).json({
                verified: true,
                status: match.suggested_status,
                confidence: match.confidence,
                message: `Successfully verified via Gmail: ${match.suggested_status}`,
                match_details: {
                    confidence_level: match.confidence_level,
                    breakdown: match.match_breakdown
                }
            });
        } else {
            console.log('[RegistrationV2] No matching email found or low confidence.');
            return res.status(200).json({
                verified: false,
                status: 'NOT_FOUND',
                message: 'No matching confirmation email found. Please upload proof manually.',
                debug: match
            });
        }

    } catch (err) {
        console.error('Check Status Error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// Removed applyDetectionResultV2 separate function to simplify imports

// 2. Upload Screenshot Proof (Manual) - V2 Implementation
const uploadProof = async (req, res) => {
    try {
        const { competition_id, proof_type } = req.body;
        const student_id = req.userId;
        const file = req.file;

        if (!competition_id || !file) {
            return res.status(400).json({ error: 'Competition ID and Proof File are required' });
        }

        // 1. Upload to Supabase Storage (Using Service Key)
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${competition_id}_${student_id}_${Date.now()}.${fileExt}`;
        const filePath = `proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('proofs')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (uploadError) {
            console.error('Supabase Storage Error:', uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('proofs')
            .getPublicUrl(filePath);

        // 2. Update Database
        await ensureRegistrationExists(student_id, competition_id, 'MANUAL_SCREENSHOT');

        let updateData = {};
        if (proof_type === 'QUALIFIED') {
            updateData = {
                shortlist_proof_url: publicUrl,
                qualification_verified: false, // Reset for Faculty Verification
                status: 'Qualified',
                source: 'MANUAL_SCREENSHOT'
            };
        } else {
            updateData = {
                proof_url: publicUrl,
                verified: false, // Needs faculty approval
                status: 'Registered',
                source: 'MANUAL_SCREENSHOT'
            };
        }

        const { data, error } = await supabase
            .from('registrations')
            .update(updateData)
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .select();

        if (error) throw error;

        res.status(201).json({
            message: 'Proof uploaded successfully. Waiting for Faculty verification.',
            data: data[0],
            proof_url: publicUrl
        });

    } catch (err) {
        console.error('Upload Proof Error:', err);
        res.status(500).json({ error: err.message || 'Upload failed', details: err });
    }
};

const uploadShortlistProof = async (req, res) => {
    try {
        const { competition_id, proof_url } = req.body;
        const student_id = req.userId;

        if (!competition_id || !proof_url) {
            return res.status(400).json({ error: 'Competition ID and Proof URL are required' });
        }

        const { data, error } = await supabase
            .from('registrations')
            .update({
                shortlist_proof_url: proof_url,
                qualification_verified: false // Reset for Faculty Verification
            })
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .select();

        if (error) throw error;

        res.status(200).json({
            message: 'Shortlist proof uploaded! Waiting for Faculty verification.',
            data: data[0]
        });

    } catch (err) {
        console.error('Upload Shortlist Proof Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



module.exports = {
    checkRegistrationStatus,
    uploadProof,
    uploadShortlistProof
};
