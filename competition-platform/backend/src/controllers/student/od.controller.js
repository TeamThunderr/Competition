// File Name: od.controller.js
// Purpose: Handle On-Duty (OD) requests for students
// Written for beginner developers

const supabase = require('../../config/supabaseClient');

// Request OD
const requestOD = async (req, res) => {
    console.log("LOG_ID: STUDENT_OD_CONTROLLER_REQUEST_OD");
    try {
        const {
            competition_id,
            from_date,
            to_date,
            is_solo,
            team_name,
            leader_name,
            section,
            members_info
            // proof_urls removed
        } = req.body;

        let { reason } = req.body;

        const student_id = req.userId;

        // Validation
        if (!competition_id || !reason || !from_date || !to_date) {
            return res.status(400).json({ error: 'Missing required OD fields (Dates, Reason).' });
        }

        // =====================================================
        // CRITICAL: OD ELIGIBILITY CHECK & PROOF FETCHING
        // =====================================================
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .select('status, qualification_verified, shortlist_proof_url')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .single();

        if (regError || !registration) {
            return res.status(403).json({ error: 'You are not registered for this competition.' });
        }

        if (registration.status !== 'Qualified') {
            return res.status(403).json({ error: 'You must be Qualified to request OD.' });
        }

        if (registration.qualification_verified !== true) {
            return res.status(403).json({ error: 'Your shortlist proof must be verified by Faculty before requesting OD.' });
        }

        const mainProofUrl = registration.shortlist_proof_url;
        if (!mainProofUrl) {
            return res.status(400).json({ error: 'System Error: Shortlist proof not found. Please contact admin.' });
        }

        console.log(`[OD Request] Student: ${student_id}, Comp: ${competition_id}, Solo: ${is_solo}`);


        // 1. Handle Team / Participation Record (Using `teams` table as the container)
        // STRATEGY: Create a "Shadow Team" specifically for this OD Request.
        // Status = 'OD_SUBMITTED'. 
        // This ensures Faculty (who view 'PENDING') do NOT see this.
        // HOD (who view 'PENDING' OD Requests -> linked to this team) WILL see it.

        // Create Shadow Team (Container for Proof)
        // Status = 'OD_SUBMITTED' ensures Faculty (who view 'PENDING') do NOT see this.
        const newTeamName = is_solo ? `OD-Solo-${student_id.substring(0, 4)}-${Date.now()}` : `OD-Team-${team_name}-${Date.now()}`;

        const { data: newTeam, error: teamError } = await supabase
            .from('teams')
            .insert([{
                competition_id: competition_id,
                leader_id: student_id,
                team_name: newTeamName,
                verification_status: 'OD_SUBMITTED', // CRITICAL: Exclude from Faculty View
                proof_url: mainProofUrl, // From registrations table
                members_info: members_info || []
            }])
            .select()
            .single();

        if (teamError) throw teamError;
        team_id = newTeam.id; // Assign the new team ID

        // [FIX] Add Team Members to 'team_members' table so they can view the OD
        if (members_info && members_info.length > 0) {
            const regNos = members_info.map(m => m.reg_no).filter(r => r); // Extract valid reg_nos

            if (regNos.length > 0) {
                // 1. Find User IDs for these Reg Nos
                const { data: memberUsers, error: userError } = await supabase
                    .from('users')
                    .select('id, registration_no')
                    .in('registration_no', regNos);

                if (!userError && memberUsers && memberUsers.length > 0) {
                    // 2. Prepare Insert Payload
                    const teamMembersPayload = memberUsers.map(u => ({
                        team_id: team_id,
                        user_id: u.id
                        // invite_status & role removed as they don't exist in schema
                    }));

                    // 3. Insert into team_members
                    const { error: memberInsertError } = await supabase
                        .from('team_members')
                        .insert(teamMembersPayload);

                    if (memberInsertError) {
                        console.error('Failed to add members to OD Shadow Team:', memberInsertError);
                        // We continue, as the OD itself is created, but log the error.
                    } else {
                        console.log(`[OD] Added ${teamMembersPayload.length} members to shadow team ${team_id}`);
                    }
                }
            }
        }

        // Verify if user already requested OD (Move check up slightly to fail fast?)
        const { data: existingOD } = await supabase
            .from('od_requests')
            .select('id')
            .eq('user_id', student_id)
            .eq('competition_id', competition_id)
            .maybeSingle();

        if (existingOD) {
            return res.status(409).json({ error: 'You have already requested OD for this competition.' });
        }

        // =====================================================
        // [NEW] BLOCKER: Check for PENDING ODs in ANY Competition
        // =====================================================
        const { data: pendingOD, error: pendingError } = await supabase
            .from('od_requests')
            .select('competitions(title)')
            .eq('user_id', student_id)
            .eq('status', 'PENDING')
            .maybeSingle();

        if (pendingError) throw pendingError;

        if (pendingOD) {
            return res.status(409).json({
                error: `You already have a Pending OD request for "${pendingOD.competitions?.title}". Please wait for HOD approval before requesting another.`
            });
        }

        // 2b. [NEW] Check for Date Overlaps with other ODs
        const reqFrom = new Date(from_date);
        const reqTo = new Date(to_date);

        const { data: conflictingODs, error: conflictError } = await supabase
            .from('od_requests')
            .select('id, from_date, to_date, status, competitions(title)')
            .eq('user_id', student_id)
            .in('status', ['PENDING', 'APPROVED']) // Active statuses
            .neq('competition_id', competition_id); // Don't check against self

        if (conflictError) throw conflictError;

        const overlap = conflictingODs.find(od => {
            const existingFrom = new Date(od.from_date);
            const existingTo = new Date(od.to_date);
            // Overlap check: (StartA <= EndB) and (EndA >= StartB)
            return (reqFrom <= existingTo && reqTo >= existingFrom);
        });

        if (overlap) {
            return res.status(409).json({
                error: `OD Request overlaps with an existing request for '${overlap.competitions?.title}' (${new Date(overlap.from_date).toLocaleDateString()} - ${new Date(overlap.to_date).toLocaleDateString()}).`
            });
        }

        // 3. [UPDATED] OD EXTENSION LOGIC - MERGE APPROACH
        // Check if this request extends a VERIFIED OD (consecutive dates)
        // If yes, UPDATE the existing OD record instead of creating a new one
        const oneDayMs = 24 * 60 * 60 * 1000;
        const prevOdSearchDate = new Date(reqFrom.getTime() - oneDayMs).toISOString().split('T')[0];

        // Find VERIFIED ODs that can be extended (only VERIFIED, not PENDING)
        const { data: candidates, error: extError } = await supabase
            .from('od_requests')
            .select('*, competitions(title, event_date)')
            .eq('user_id', student_id)
            .gte('to_date', prevOdSearchDate) // End date must be at least near the new start
            .eq('status', 'APPROVED'); // ONLY APPROVED ODs can be extended

        if (extError) throw extError;

        // Filter for valid extension candidate (exactly 1 day gap)
        const extendableOD = candidates?.find(od => {
            const prevEnd = new Date(od.to_date);
            const gapTime = reqFrom - prevEnd;
            const gapDays = Math.ceil(gapTime / oneDayMs);

            // Must be exactly 1 day after previous OD ends
            return gapDays === 1;
        });

        let odReq;

        if (extendableOD) {
            console.log(`[OD Extension] Extending OD ${extendableOD.id} by merging dates`);

            // Prepare competitions_info array
            let competitionsInfo = extendableOD.competitions_info || [];

            // If this is the first extension, add the original competition
            if (competitionsInfo.length === 0) {
                competitionsInfo.push({
                    competition_id: extendableOD.competition_id,
                    title: extendableOD.competitions?.title || 'Unknown',
                    from_date: extendableOD.from_date,
                    to_date: extendableOD.to_date
                });
            }

            // Add the new competition to the array
            const { data: newComp } = await supabase
                .from('competitions')
                .select('title, event_date')
                .eq('id', competition_id)
                .single();

            competitionsInfo.push({
                competition_id: competition_id,
                title: newComp?.title || 'Unknown',
                from_date: from_date,
                to_date: to_date
            });

            // UPDATE the existing OD record (merge)
            const { data: updatedOD, error: updateError } = await supabase
                .from('od_requests')
                .update({
                    to_date: to_date, // Extend the end date
                    competition_id: competition_id, // Update to latest competition
                    team_id: team_id, // Update team info
                    reason: `${extendableOD.reason}\n\n[Extended on ${new Date().toLocaleDateString()}]: ${reason}`,
                    status: 'PENDING', // Reset to PENDING for HOD re-approval
                    is_extension: true,
                    extension_count: (extendableOD.extension_count || 0) + 1,
                    original_from_date: extendableOD.original_from_date || extendableOD.from_date,
                    competitions_info: competitionsInfo,
                    parent_od_id: extendableOD.parent_od_id || extendableOD.id // Track original parent
                })
                .eq('id', extendableOD.id)
                .select('*, competitions(title, event_date)')
                .single();

            if (updateError) throw updateError;
            odReq = updatedOD;

            res.status(200).json({
                message: 'OD Extended successfully. Resubmitted to HOD for approval.',
                data: odReq,
                isExtension: true
            });

        } else {
            // NORMAL INSERT (No extension found)
            const { data: newOD, error: insertError } = await supabase
                .from('od_requests')
                .insert([{
                    user_id: student_id,
                    competition_id: competition_id,
                    team_id: team_id,
                    reason: reason,
                    from_date: from_date,
                    to_date: to_date,
                    status: 'PENDING',
                    is_extension: false,
                    extension_count: 0,
                    original_from_date: from_date,
                    competitions_info: []
                }])
                .select()
                .single();

            if (insertError) throw insertError;
            odReq = newOD;

            res.status(201).json({ message: 'OD Request submitted successfully to HOD.', data: odReq });
        }

    } catch (err) {
        console.error('OD Request Error:', err);
        res.status(500).json({ error: 'Internal Server Error: ' + err.message });
    }
};

// Get my OD requests
const getMyODRequests = async (req, res) => {
    try {
        const student_id = req.userId;
        console.log(`[OD] Fetching requests for student: ${student_id}`);

        // 1. Get teams I belong to
        const { data: myTeams } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', student_id);
        // .eq('invite_status', 'ACCEPTED'); // Removed as column doesn't exist

        const teamIds = myTeams?.map(t => t.team_id) || [];

        // 2. Fetch OD Requests (My Own OR My Team's)
        let query = supabase
            .from('od_requests')
            .select(`
                *,
                competitions (title, event_date),
                requester:users!od_requests_user_id_fkey (full_name, registration_no),
                teams (team_name, members_info, users!teams_leader_id_fkey(full_name, registration_no))
            `)
            .order('created_at', { ascending: false });

        if (teamIds.length > 0) {
            // Valid POSTGREST syntax for IN with UUIDs: team_id.in.(uuid1,uuid2)
            // Note: No quotes needed around filtering unless string contains special chars, but UUIDs are safe.
            // However, Supabase JS .or() expects a specific format.
            const teamListStr = teamIds.join(',');
            query = query.or(`user_id.eq.${student_id},team_id.in.(${teamListStr})`);
        } else {
            query = query.eq('user_id', student_id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[OD] Fetch Error:', error);
            throw error;
        }

        console.log(`[OD] Found ${data ? data.length : 0} requests.`);
        res.status(200).json(data);

    } catch (err) {
        console.error('Get OD Requests Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    requestOD,
    getMyODRequests
};
