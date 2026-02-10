// File Name: team.controller.js
// Purpose: Manage teams and memberships
// Written for beginner developers

const supabase = require('../../config/supabaseClient');
const crypto = require('crypto');
const studentService = require('../../services/student/student.service');

// Create a new team
const createTeam = async (req, res) => {
    try {
        const { competition_id, team_name } = req.body;
        const leader_id = req.userId; // From middleware

        if (!competition_id || !team_name) {
            return res.status(400).json({ error: 'Competition ID and Team Name are required' });
        }

        // 1. Create the team
        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .insert([{ competition_id, leader_id, team_name }])
            .select()
            .single();

        if (teamError) return res.status(500).json({ error: teamError.message });

        // 2. Add leader as a member (Status: ACCEPTED)
        const { error: memberError } = await supabase
            .from('team_members')
            .insert([{
                team_id: teamData.id,
                user_id: leader_id,
                invite_status: 'ACCEPTED'
            }]);

        if (memberError) {
            // Rollback (delete team) if member creation fails - optional but good practice
            await supabase.from('teams').delete().eq('id', teamData.id);
            return res.status(500).json({ error: memberError.message });
        }

        res.status(201).json({ message: 'Team created successfully', team: teamData });
    } catch (err) {
        console.error('Error creating team:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Invite a member to the team
const inviteMember = async (req, res) => {
    try {
        const { team_id, email } = req.body;
        const requesterId = req.userId;

        // 1. Verify requester is the leader
        const { data: team } = await supabase
            .from('teams')
            .select('leader_id')
            .eq('id', team_id)
            .single();

        if (!team || team.leader_id !== requesterId) {
            return res.status(403).json({ error: 'Only the team leader can invite members' });
        }

        // 2. Find the user by email
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'User with this email not found' });
        }

        // 3. Send Invite
        const { error: inviteError } = await supabase
            .from('team_members')
            .insert([{
                team_id,
                user_id: user.id,
                invite_status: 'PENDING'
            }]);

        if (inviteError) return res.status(500).json({ error: inviteError.message });

        res.status(200).json({ message: 'Invitation sent' });
    } catch (err) {
        console.error('Error inviting member:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Accept an invitation
const acceptInvite = async (req, res) => {
    try {
        const { team_id } = req.body;
        const userId = req.userId;

        const { error } = await supabase
            .from('team_members')
            .update({ invite_status: 'ACCEPTED' })
            .eq('team_id', team_id)
            .eq('user_id', userId);

        if (error) return res.status(500).json({ error: error.message });

        res.status(200).json({ message: 'Invitation accepted' });
    } catch (err) {
        console.error('Error accepting invite:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Submit Team Verification (Wizard Flow V2 + Auto OD Request)
const submitVerification = async (req, res) => {
    console.log("LOG_ID: TEAM_CONTROLLER_SUBMIT_VERIFICATION");
    try {
        const {
            competition_id,
            team_id,
            is_solo,
            team_name,
            leader_name,
            leader_reg_no, // NEW FIELD
            section,
            academic_year,
            department,
            members_info,
            proof_urls,
            // V3 New Fields for Auto OD
            from_date,
            to_date,
            reason
        } = req.body;

        const userId = req.userId;

        // Validation
        if (!competition_id) {
            return res.status(400).json({ error: 'Competition ID is required.' });
        }

        // =====================================================
        // [NEW] AUTO-FETCH PROOF & VALIDATE ELIGIBILITY
        // =====================================================
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .select('status, qualification_verified, shortlist_proof_url')
            .eq('user_id', userId)
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

        // =====================================================
        // [NEW] TEAMMATE VALIDATION
        // =====================================================
        if (!is_solo && members_info && members_info.length > 0) {
            for (const member of members_info) {
                const validationResult = await studentService.validateTeammate(
                    member.reg_no,
                    member.name,
                    competition_id
                );
                if (!validationResult.valid) {
                    return res.status(400).json({
                        error: `Teammate Validation Failed: ${validationResult.error} (${member.reg_no})`
                    });
                }
            }
        }

        // Auto-assign proof
        const finalProofUrls = [mainProofUrl];

        // derived team name for solo
        let finalTeamName = team_name;
        if (is_solo) {
            finalTeamName = `Individual - ${leader_name}`;
        } else {
            if (!team_name) return res.status(400).json({ error: 'Team Name is required for team requests.' });
        }

        let currentTeamId = team_id;

        // 1. Check if team already exists for this competition and leader
        if (!currentTeamId) {
            const { data: existingTeam, error: existingError } = await supabase
                .from('teams')
                .select('id')
                .eq('competition_id', competition_id)
                .eq('leader_id', userId)
                .maybeSingle();

            if (existingError) {
                console.error('Error checking existing team:', existingError);
            }

            if (existingTeam) {
                // Reuse existing team
                currentTeamId = existingTeam.id;
                console.log(`[Team] Reusing existing team ${currentTeamId} for competition ${competition_id}`);
            }
        }

        // 2. If no team_id and no existing team, Create a New Team
        if (!currentTeamId) {
            // Create Team
            const { data: newTeam, error: createError } = await supabase
                .from('teams')
                .insert([{
                    competition_id,
                    leader_id: userId,
                    team_name: finalTeamName,
                    leader_name,
                    leader_reg_no, // Store it
                    section,
                    academic_year,
                    department,
                    members_info, // Store JSON
                    proof_urls: finalProofUrls, // Store array
                    proof_url: finalProofUrls[0], // Legacy support
                    verification_status: 'PENDING'
                }])
                .select()
                .single();

            if (createError) throw createError;
            currentTeamId = newTeam.id;

            // Add leader to team_members
            await supabase.from('team_members').insert([{
                team_id: currentTeamId,
                user_id: userId,
                invite_status: 'ACCEPTED'
            }]);

        } else {
            // 2. Update Existing Team
            // Verify Leader
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .select('leader_id')
                .eq('id', currentTeamId)
                .single();

            if (teamError || !team) return res.status(404).json({ error: 'Team not found' });
            if (team.leader_id !== userId) return res.status(403).json({ error: 'Only Team Leader can submit verification' });

            // Update
            const { error: updateError } = await supabase
                .from('teams')
                .update({
                    team_name: finalTeamName,
                    leader_name,
                    leader_reg_no, // Update it too
                    section,
                    academic_year,
                    academic_year,
                    department,
                    members_info,
                    proof_urls: finalProofUrls,
                    proof_url: finalProofUrls[0],
                    verification_status: 'PENDING'
                })
                .eq('id', currentTeamId);

            if (updateError) throw updateError;
        }

        // 3. [UPDATED] OD EXTENSION LOGIC - MERGE APPROACH (V3 Automation)
        if (reason && from_date && to_date) {
            const reqFrom = new Date(from_date);
            const oneDayMs = 24 * 60 * 60 * 1000;
            const prevOdSearchDate = new Date(reqFrom.getTime() - oneDayMs).toISOString().split('T')[0];

            // Find APPROVED ODs that can be extended
            const { data: candidates, error: extError } = await supabase
                .from('od_requests')
                .select('*, competitions(title, event_date)')
                .eq('user_id', userId)
                .gte('to_date', prevOdSearchDate)
                .eq('status', 'APPROVED');

            if (extError) throw extError;

            const extendableOD = candidates?.find(od => {
                const prevEnd = new Date(od.to_date);
                const gapTime = reqFrom - prevEnd;
                const gapDays = Math.ceil(gapTime / oneDayMs);
                return gapDays === 1;
            });

            if (extendableOD) {
                console.log(`[OD Extension] Extending OD ${extendableOD.id} by merging dates in TeamController`);

                let competitionsInfo = extendableOD.competitions_info || [];
                if (competitionsInfo.length === 0) {
                    competitionsInfo.push({
                        competition_id: extendableOD.competition_id,
                        title: extendableOD.competitions?.title || 'Unknown',
                        from_date: extendableOD.from_date,
                        to_date: extendableOD.to_date
                    });
                }

                const { data: newComp } = await supabase
                    .from('competitions')
                    .select('title')
                    .eq('id', competition_id)
                    .single();

                competitionsInfo.push({
                    competition_id: competition_id,
                    title: newComp?.title || 'Unknown',
                    from_date: from_date,
                    to_date: to_date
                });

                const { error: updateError } = await supabase
                    .from('od_requests')
                    .update({
                        to_date: to_date,
                        competition_id: competition_id,
                        team_id: currentTeamId,
                        reason: `${extendableOD.reason}\n\n[Extended]: ${reason}`,
                        status: 'PENDING',
                        is_extension: true,
                        extension_count: (extendableOD.extension_count || 0) + 1,
                        original_from_date: extendableOD.original_from_date || extendableOD.from_date,
                        competitions_info: competitionsInfo,
                        parent_od_id: extendableOD.parent_od_id || extendableOD.id
                    })
                    .eq('id', extendableOD.id);

                if (updateError) throw updateError;
            } else {
                // Regular OD Upsert
                const { data: existingOD } = await supabase
                    .from('od_requests')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('competition_id', competition_id)
                    .maybeSingle();

                if (existingOD) {
                    const { error: updateError } = await supabase
                        .from('od_requests')
                        .update({
                            team_id: currentTeamId,
                            reason,
                            from_date,
                            to_date,
                            status: 'PENDING',
                            is_extension: false // Ensure reset if it was manually set
                        })
                        .eq('id', existingOD.id);
                    if (updateError) throw updateError;
                } else {
                    const { error: insertError } = await supabase
                        .from('od_requests')
                        .insert([{
                            user_id: userId,
                            competition_id,
                            team_id: currentTeamId,
                            reason,
                            from_date,
                            to_date,
                            status: 'PENDING',
                            is_extension: false
                        }]);
                    if (insertError) throw insertError;
                }
            }
        }


        res.status(200).json({ message: 'Verification & OD Request submitted successfully', team_id: currentTeamId });

    } catch (err) {
        console.error('Error submitting verification:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
};

// Upload Proof (Legacy/Simple) - Keeping for compatibility or simple updates
const uploadProof = async (req, res) => {
    try {
        const { team_id, proof_url } = req.body;
        const userId = req.userId;

        if (!team_id || !proof_url) {
            return res.status(400).json({ error: 'Team ID and Proof URL are required' });
        }

        // 1. Verify requester is the leader
        const { data: team, error: teamCheckError } = await supabase
            .from('teams')
            .select('leader_id, verification_status')
            .eq('id', team_id)
            .single();

        if (teamCheckError || !team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.leader_id !== userId) {
            return res.status(403).json({ error: 'Only the team leader can upload proof' });
        }

        // 2. Check Lock (If verified, cannot change)
        if (team.verification_status === 'VERIFIED') {
            return res.status(409).json({ error: 'Team is already verified. Cannot change proof.' });
        }

        // 3. Update Proof
        const { data, error } = await supabase
            .from('teams')
            .update({
                proof_url: proof_url,
                verification_status: 'PENDING' // Reset to PENDING if they re-upload (e.g. after rejection)
            })
            .eq('id', team_id)
            .select();

        if (error) throw error;

        res.status(200).json({ message: 'Proof uploaded successfully', team: data[0] });

    } catch (err) {
        console.error('Error uploading proof:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    createTeam,
    inviteMember,
    acceptInvite,
    uploadProof,
    submitVerification
};
