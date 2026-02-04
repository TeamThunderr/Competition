// File Name: team.controller.js
// Purpose: Manage teams and memberships
// Written for beginner developers

const supabase = require('../../config/supabaseClient');
const crypto = require('crypto');

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
    try {
        const {
            competition_id,
            team_id,
            is_solo,
            team_name,
            leader_name,
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
        if (!competition_id || !proof_urls || proof_urls.length === 0) {
            return res.status(400).json({ error: 'Competition and at least one Proof are required.' });
        }

        // derived team name for solo
        let finalTeamName = team_name;
        if (is_solo) {
            finalTeamName = `Individual - ${leader_name}`;
        } else {
            if (!team_name) return res.status(400).json({ error: 'Team Name is required for team requests.' });
        }

        let currentTeamId = team_id;

        // 1. If no team_id, Create a New Team
        if (!currentTeamId) {
            // Create Team
            const { data: newTeam, error: createError } = await supabase
                .from('teams')
                .insert([{
                    competition_id,
                    leader_id: userId,
                    team_name: finalTeamName,
                    leader_name,
                    section,
                    academic_year,
                    academic_year,
                    department,
                    members_info, // Store JSON
                    proof_urls, // Store array
                    proof_url: proof_urls[0], // Legacy support
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
                    section,
                    academic_year,
                    academic_year,
                    department,
                    members_info,
                    proof_urls,
                    proof_url: proof_urls[0],
                    verification_status: 'PENDING'
                })
                .eq('id', currentTeamId);

            if (updateError) throw updateError;
        }

        // 3. Auto-Create/Upsert OD Request (V3 Automation)
        // Manual Upsert Logic to avoid missing constraint issues
        if (reason && from_date && to_date) {
            // Check existing
            const { data: existingOD } = await supabase
                .from('od_requests')
                .select('id')
                .eq('user_id', userId)
                .eq('competition_id', competition_id)
                .maybeSingle();

            if (existingOD) {
                // Update
                const { error: updateError } = await supabase
                    .from('od_requests')
                    .update({
                        team_id: currentTeamId,
                        reason,
                        from_date,
                        to_date,
                        status: 'PENDING'
                    })
                    .eq('id', existingOD.id);

                if (updateError) console.error("Auto OD Update Error:", updateError);
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('od_requests')
                    .insert([{
                        user_id: userId,
                        competition_id,
                        team_id: currentTeamId,
                        reason,
                        from_date,
                        to_date,
                        status: 'PENDING'
                    }]);

                if (insertError) console.error("Auto OD Insert Error:", insertError);
            }
        }


        res.status(200).json({ message: 'Verification & OD Request submitted successfully', team_id: currentTeamId });

    } catch (err) {
        console.error('Error submitting verification:', err);
        res.status(500).json({ error: 'Internal Server Error' });
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
