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

        if (!competition_id) return res.status(400).json({ error: 'Competition ID is required' });

        // 1. Get Competition Details (Title)
        const { data: competition, error: compError } = await supabase
            .from('competitions')
            .select('title')
            .eq('id', competition_id)
            .single();

        if (compError || !competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }

        // 2. Trigger Gmail Scan if token provided
        if (provider_token) {
            console.log(`[Registration] Triggering Gmail Scan for ${competition.title}...`);
            await gmailService.processAndSaveEmails(provider_token, student_id);
        }

        // 3. Check for Match (Fuzzy Matching in JS)
        // Fetch recent detections for this user
        const { data: detectedList, error: detectError } = await supabase
            .from('detected_hackathons')
            .select('*')
            .eq('user_id', student_id)
            // .eq('status', 'REGISTERED') // Removed status check for debugging
            .order('email_date', { ascending: false });

        let match = null;
        if (detectedList && detectedList.length > 0) {
            // Helper: Tokenize and Clean
            const tokenize = (str) => {
                if (!str || typeof str !== 'string') return [];
                return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
            };

            // Helper: Fuzzy Match with Year Handling
            const isFuzzyMatch = (compTitle, detectedName) => {
                const tokensA = tokenize(compTitle);
                const tokensB = tokenize(detectedName);

                const checkSubset = (subset, superset) => {
                    if (subset.length === 0) return false;
                    let matches = 0;
                    for (const t1 of subset) {
                        const found = superset.some(t2 => {
                            if (t1 === t2) return true;
                            // Year Check: '25' matches '2025'
                            if (!isNaN(t1) && !isNaN(t2)) {
                                if ((t1.length === 2 && t2.length === 4 && t2.endsWith(t1)) ||
                                    (t1.length === 4 && t2.length === 2 && t1.endsWith(t2))) {
                                    return true;
                                }
                            }
                            return false;
                        });
                        if (found) matches++;
                    }
                    // If subset is short (1-2 words), require 100% match. If longer, 75%.
                    const threshold = subset.length <= 2 ? 1.0 : 0.75;
                    return (matches / subset.length) >= threshold;
                };

                return checkSubset(tokensA, tokensB) || checkSubset(tokensB, tokensA);
            };

            console.log(`[Matching] Target: ${competition.title}`);

            match = detectedList.find(d => {
                if (d.status !== 'REGISTERED' && d.status !== 'QUALIFIED') return false;

                const isMatch = isFuzzyMatch(competition.title, d.hackathon_name);
                console.log(`[Matching] Checking: "${d.hackathon_name}" vs "${competition.title}" -> ${isMatch}`);
                return isMatch;
            });

            // Fallback: Check snippet if name match failed
            if (!match) {
                match = detectedList.find(d => {
                    if (d.status !== 'REGISTERED' && d.status !== 'QUALIFIED') return false;
                    // Also try fuzzy match on snippet
                    return isFuzzyMatch(competition.title, d.snippet || '');
                });
            }
        }

        if (match) {
            console.log('[Registration] Match Found:', match);

            // 4. Auto-Register / Verify
            const { data: registration, error: regError } = await supabase
                .from('registrations')
                .upsert({
                    user_id: student_id,
                    competition_id: competition_id,
                    source: 'AUTO_GMAIL',
                    status: 'REGISTERED',
                    verified: true,
                    verified_by: 'SYSTEM', // System verified
                    proof_url: 'GMAIL_AUTO_MATCH'
                }, { onConflict: 'user_id, competition_id' })
                .select()
                .single();

            if (regError) {
                console.error('Registration Upsert Error:', regError);
                return res.status(500).json({ error: 'Failed to update registration status' });
            }

            return res.status(200).json({
                status: 'REGISTERED',
                verified: true,
                source: 'AUTO_GMAIL',
                message: 'Verified via Gmail!'
            });
        }

        // 5. Fallback: Check existing registration if scan didn't find anything
        const { data: existing, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .single();

        if (existing) {
            return res.status(200).json({ status: 'REGISTERED', source: existing.source, verified: existing.verified });
        } else {
            return res.status(200).json({
                status: 'NOT_FOUND',
                message: 'No matching email found. Please upload proof.',
                debug: {
                    competitionTitle: competition.title,
                    detectedList: (detectedList || []).map(d => `${d.hackathon_name} [${d.status}] (Sub: ${d.snippet.substring(0, 30)}...)`)
                }
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
