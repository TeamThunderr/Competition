// File Name: registration.controller.js
// Purpose: Handle student registration attempts (Gmail check or Proof upload)
// Written for beginner developers

const supabase = require('../../config/supabaseClient');
const gmailService = require('../../services/gmailService');

const checkRegistrationStatus = async (req, res) => {
    try {
        console.log('[Registration] Request received:', req.body, 'User:', req.userId);
        const { competition_id, provider_token } = req.body;
        const student_id = req.userId;

        console.log(`[DEBUG] CheckStatus - ID: ${competition_id} (Type: ${typeof competition_id})`);

        if (!competition_id) return res.status(400).json({ error: 'Competition ID is required' });

        // 1. Get Competition Details
        const { data: competition, error: compError } = await supabase
            .from('competitions')
            .select('title, organizer')
            .eq('id', competition_id)
            .single();

        if (compError || !competition) {
            console.error('[Registration] Competition Lookup Error:', compError);
            return res.status(404).json({ error: 'Competition not found', details: compError });
        }

        // 2. Perform Targeted Gmail Verification
        if (!provider_token) {
            return res.status(400).json({ error: 'Gmail access token required for verification.' });
        }

        console.log(`[Registration] Verifying '${competition.title}' for user ${student_id}...`);

        // Use verifySpecificRegistration instead of full scan
        const match = await gmailService.verifySpecificRegistration(
            provider_token,
            competition.title,
            null // organizer domain - could be added to DB later
        );

        if (match) {
            console.log('[Registration] Verification Successful:', match.subject);

            // 3. Update Database (Registrations)
            const { data: registration, error: regError } = await supabase
                .from('registrations')
                .upsert({
                    user_id: student_id,
                    competition_id: competition_id,
                    source: 'AUTO_GMAIL',
                    // status: match.matchStatus, // REMOVED: Column does not exist in registrations
                    verified: true,
                    verified_by: null, // System verified
                    proof_url: 'Verified via Gmail: ' + match.subject
                }, { onConflict: 'user_id, competition_id' })
                .select()
                .single();

            if (regError) {
                console.error('Registration Upsert Error:', regError);
                return res.status(500).json({ error: 'Failed to update registration status' });
            }

            // 4. Handle Qualification Logic (if detected as Shortlisted/Qualified)
            if (match.matchStatus === 'QUALIFIED') {
                const { error: statusError } = await supabase
                    .from('competition_status')
                    .upsert({
                        user_id: student_id,
                        competition_id: competition_id,
                        is_shortlisted: true,
                        updated_at: new Date()
                    }, { onConflict: 'user_id, competition_id' });

                if (statusError) {
                    console.error('Failed to update competition_status:', statusError);
                    // Don't fail the whole request, just log it.
                }
            }

            return res.status(200).json({
                verified: true,
                status: match.matchStatus,
                message: `Successfully verified via email: "${match.subject}"`,
                match_details: {
                    subject: match.subject,
                    date: match.date
                }
            });
        } else {
            console.log('[Registration] No matching email found.');
            return res.status(200).json({
                verified: false,
                status: 'NOT_FOUND',
                message: 'No matching confirmation email found in the last 90 days. Please upload proof manually.'
            });
        }

    } catch (err) {
        console.error('Check Status Error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// 2. Upload Screenshot Proof (Manual)
const uploadProof = async (req, res) => {
    try {
        const { competition_id, proof_url } = req.body;
        const student_id = req.userId;

        if (!competition_id || !proof_url) {
            return res.status(400).json({ error: 'Competition ID and Proof URL are required' });
        }

        // Check if already exists
        const { data: existing } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Registration entry already exists.' });
        }

        // Create new registration entry
        const { data, error } = await supabase
            .from('registrations')
            .insert([{
                user_id: student_id,
                competition_id: competition_id,
                source: 'MANUAL_SCREENSHOT',
                proof_url: proof_url,
                verified: false, // Needs faculty approval
                verified_by: null
            }])
            .select();

        if (error) throw error;

        res.status(201).json({ message: 'Proof uploaded. Waiting for Faculty verification.', data: data[0] });

    } catch (err) {
        console.error('Upload Proof Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    checkRegistrationStatus,
    uploadProof
};
